import { useRef, useState } from "react";
import "./PromptBar.css";

type PromptState = "idle" | "submitting" | "streaming" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  service_not_configured:
    "The portfolio assistant isn't set up yet — please try again later, or email me instead.",
  rate_limited: "You're asking a bit fast — please wait a minute and try again.",
  question_too_long: "That question is over 1,000 characters — please shorten it.",
  invalid_question: "Please type a question first.",
  gemini_failed: "The portfolio assistant couldn't answer right now. Please try again in a moment.",
};

const FALLBACK_ERROR = "The portfolio assistant couldn't answer right now. Please try again in a moment.";

async function errorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "code" in data && typeof data.code === "string") {
      return ERROR_MESSAGES[data.code] ?? FALLBACK_ERROR;
    }
  } catch {
    // Fall through to the generic message — never show raw response text.
  }
  return FALLBACK_ERROR;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value: string): string {
  return /^(https?:\/\/|mailto:)/i.test(value) ? value : "#";
}

function renderMarkdown(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const escaped = escapeHtml(line);
      if (escaped.startsWith("### ")) return `<h4>${escaped.slice(4)}</h4>`;
      if (escaped.startsWith("## ")) return `<h3>${escaped.slice(3)}</h3>`;
      if (escaped.startsWith("# ")) return `<h2>${escaped.slice(2)}</h2>`;
      if (/^[-*] /.test(escaped)) return `<li>${escaped.slice(2)}</li>`;
      return escaped ? `<p>${escaped}</p>` : "";
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n?)+/g, (items) => `<ul>${items}</ul>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, url: string) => `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noreferrer">${label}</a>`);
}

function removeInternalMetadata(value: string): string {
  return value
    .replace(/\s*\(SOURCE_ID:\s*[^)]+\)/gi, "")
    .replace(/\s*\(SOURCE_TITLE:\s*[^)]+\)/gi, "")
    .replace(/\s*SOURCE_ID:\s*[^,.)\n]+/gi, "")
    .replace(/\s*SOURCE_TITLE:\s*[^,.)\n]+/gi, "");
}

interface PromptBarProps {
  demo?: boolean;
  placeholder?: string;
}

export default function PromptBar({
  demo = false,
  placeholder = "Ask about my projects, experience, or AI work…",
}: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<PromptState>("idle");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function submitQuestion() {
    const question = prompt.trim();
    if (!question || state === "submitting" || state === "streaming") return;

    setAnswer("");
    setError("");
    setState("submitting");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(await errorMessage(response));
      }

      if (!response.body) throw new Error(FALLBACK_ERROR);

      setState("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let nextAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        nextAnswer += decoder.decode(value, { stream: true });
        setAnswer(removeInternalMetadata(nextAnswer));
      }

      nextAnswer += decoder.decode();
      setAnswer(removeInternalMetadata(nextAnswer));
      setState("idle");
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : FALLBACK_ERROR);
    }
  }

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    await submitQuestion();
  }

  const isBusy = state === "submitting" || state === "streaming";
  const buttonLabel = state === "submitting" ? "Connecting…" : state === "streaming" ? "Streaming…" : "Send";
  const accessibilityStatus = state === "submitting"
    ? "Connecting to the portfolio."
    : state === "streaming"
      ? "Streaming a portfolio answer."
      : state === "error"
        ? error
        : answer
          ? "Portfolio answer complete."
          : "";

  return (
    <form ref={formRef} className="prompt-bar" onSubmit={handleSubmit} aria-label="Ask My Portfolio">
      <label className="prompt-bar__label" htmlFor="portfolio-prompt">
        Ask My Portfolio
      </label>
      <div className="prompt-bar__surface" data-state={state}>
        <textarea
          id="portfolio-prompt"
          className="prompt-bar__input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submitQuestion();
            }
          }}
          placeholder={placeholder}
          rows={2}
          maxLength={1000}
          aria-describedby="portfolio-prompt-status"
        />
        <div className="prompt-bar__footer">
          <div className="prompt-bar__hints" aria-hidden="true">
            <span>Enter to send · Shift+Enter for a new line</span>
            {demo && <span>Demo</span>}
          </div>
          <span className="prompt-bar__count" aria-hidden="true">
            {prompt.length}/1000
          </span>
          <button className="prompt-bar__send" type="submit" disabled={isBusy || !prompt.trim()}>
            {buttonLabel}
          </button>
        </div>
      </div>
      <p className="prompt-bar__status" id="portfolio-prompt-status" aria-live="polite">
        {error || (state === "streaming" ? "Writing an answer from portfolio records…" : answer ? "Answer complete." : "Ask about projects, experience, or AI work.")}
      </p>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {accessibilityStatus}
      </span>
      {answer && (
        <section className="prompt-bar__answer" aria-live="polite" aria-label="Portfolio answer">
          <p className="prompt-bar__answer-label">Portfolio response</p>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }} />
        </section>
      )}
    </form>
  );
}
