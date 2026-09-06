import { useState } from "react";
import "./PromptBar.css";

type PromptState = "idle" | "submitting" | "streaming" | "error";

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

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
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
        const details = await response.text();
        throw new Error(details || "Unable to ask the portfolio right now.");
      }

      if (!response.body) throw new Error("The portfolio response did not include a stream.");

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
      setError(requestError instanceof Error ? requestError.message : "Unable to ask the portfolio right now.");
    }
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
    <form className="prompt-bar" onSubmit={handleSubmit} aria-label="Ask My Portfolio">
      <label className="prompt-bar__label" htmlFor="portfolio-prompt">
        Ask My Portfolio
      </label>
      <div className="prompt-bar__surface" data-state={state}>
        <textarea
          id="portfolio-prompt"
          className="prompt-bar__input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={placeholder}
          rows={2}
          aria-describedby="portfolio-prompt-status"
        />
        <div className="prompt-bar__footer">
          <div className="prompt-bar__hints" aria-hidden="true">
            <span>@ sources</span>
            <span>/ commands</span>
            {demo && <span>Demo</span>}
          </div>
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
