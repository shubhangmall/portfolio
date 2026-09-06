import type { APIRoute } from "astro";
import { searchPortfolio } from "../../lib/portfolio";
import { streamGemini } from "../../lib/server/gemini";

export const prerender = false;

const MAX_QUESTION_LENGTH = 1000;
const RESULT_LIMIT = 8;

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
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return new Response(JSON.stringify({ error: "Request body must be JSON" }), {
      status: 415,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const question = typeof body === "object" && body !== null && "question" in body
    ? body.question
    : undefined;

  if (typeof question !== "string" || question.trim().length === 0) {
    return new Response(JSON.stringify({ error: "question must be a non-empty string" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return new Response(JSON.stringify({ error: `question must be ${MAX_QUESTION_LENGTH} characters or fewer` }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!import.meta.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Gemini service is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = await searchPortfolio(question, RESULT_LIMIT);
  const prompt = groundedPrompt(question.trim(), results);
  const encoder = new TextEncoder();
  const geminiStream = streamGemini(prompt);
  let firstChunk: IteratorResult<string>;

  try {
    firstChunk = await geminiStream.next();
  } catch {
    return new Response(JSON.stringify({ error: "Gemini request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
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
