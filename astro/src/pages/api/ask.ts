import type { APIRoute } from "astro";
import { searchPortfolio } from "../../lib/portfolio";
import { streamGemini } from "../../lib/server/gemini";

export const prerender = false;

const MAX_QUESTION_LENGTH = 1000;
const RESULT_LIMIT = 8;

// Best-effort per-IP rate limiting. The Astro server runs on Vercel
// serverless functions, so this map is per-instance, not global — it still
// stops a single client hammering one warm instance. A shared store
// (e.g. Upstash Redis) would be needed for a strict global limit.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitByIp = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitByIp.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function jsonError(status: number, code: string, message: string, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function groundedPrompt(question: string, results: Awaited<ReturnType<typeof searchPortfolio>>): string {
  const context = results.length
    ? results
        .map(({ document }) => {
          return [
            `SOURCE_ID: ${document.source.id}`,
            `SOURCE_TITLE: ${document.source.title}`,
            `SOURCE_KIND: ${document.source.kind}`,
            `CONTENT: ${document.text}`,
          ].join("\n");
        })
        .join("\n\n---\n\n")
    : "No relevant portfolio records were found.";

  return [
    "You are the portfolio assistant for Shubhang Mall.",
    "Answer the user's question using only the portfolio records below.",
    "Do not invent, infer, or supplement facts beyond those records.",
    "If the records do not contain enough information, say: I don't have enough portfolio information to answer that.",
    "Keep the answer concise. Never show SOURCE_ID, SOURCE_TITLE, or other internal metadata in the answer.",
    `USER_QUESTION: ${question}`,
    `PORTFOLIO_RECORDS:\n${context}`,
  ].join("\n\n");
}

export const POST: APIRoute = async ({ request }) => {
  if (rateLimited(clientIp(request))) {
    return jsonError(429, "rate_limited", "Too many questions — please wait a minute and try again.", {
      "Retry-After": "60",
    });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonError(415, "invalid_content_type", "Request body must be JSON.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const question = typeof body === "object" && body !== null && "question" in body
    ? body.question
    : undefined;

  if (typeof question !== "string" || question.trim().length === 0) {
    return jsonError(400, "invalid_question", "Please type a question first.");
  }

  if (question.trim().length > MAX_QUESTION_LENGTH) {
    return jsonError(413, "question_too_long", `Questions must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
  }

  if (!import.meta.env.GEMINI_API_KEY) {
    return jsonError(500, "service_not_configured", "The portfolio assistant is not set up yet.");
  }

  const results = await searchPortfolio(question, RESULT_LIMIT);
  const prompt = groundedPrompt(question.trim(), results);
  const encoder = new TextEncoder();
  const geminiStream = streamGemini(prompt);
  let firstChunk: IteratorResult<string>;

  try {
    firstChunk = await geminiStream.next();
  } catch {
    return jsonError(502, "gemini_failed", "The portfolio assistant could not answer right now.");
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!firstChunk.done) {
          controller.enqueue(encoder.encode(firstChunk.value));
        }
        for await (const chunk of geminiStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error instanceof Error ? error : new Error("Gemini request failed"));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
