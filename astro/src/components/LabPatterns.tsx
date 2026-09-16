import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LabTrace, TraceEvent } from "../lib/ai-lab";
import "./LabPatterns.css";

export type SourceRef = { id: string; label: string; detail: string };
export type TableRow = { label: string; value: string; detail: string };
export type PlanItem = { label: string; detail: string };
export type DiffRow = { old?: number; current?: number; type: "context" | "add" | "remove"; text: string };

export function ThinkingState({ label }: { label: string }) {
  return <span className="lab-thinking" aria-label={label}><span className="lab-thinking__spark" aria-hidden="true" />{label}</span>;
}

export function ReplayScrubber({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  const progress = max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0;
  return <div className="replay-scrubber">
    <div className="replay-scrubber__topline"><span>Replay position</span><span>{value} / {max} events</span></div>
    <input aria-label="Replay position" style={{ "--scrub-progress": `${progress}%` } as CSSProperties} type="range" min="1" max={Math.max(max, 1)} value={Math.min(Math.max(value, 1), Math.max(max, 1))} onChange={(event) => onChange(Number(event.target.value))} />
  </div>;
}

export function ReplayPrompt({ trace }: { trace: LabTrace }) {
  const [prompt, setPrompt] = useState(trace.replayPrompt ?? "Explain this system");
  const [enhanced, setEnhanced] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  return <div className="replay-prompt">
    <div className="replay-prompt__topline"><span className="lab-kicker">Replay input</span><button type="button" className="prompt-model" aria-expanded={modelOpen} onClick={() => setModelOpen((open) => !open)}>Replay fixture <span aria-hidden="true">⌄</span></button></div>
    <label htmlFor={`${trace.slug}-replay-prompt`}>Fixture prompt preview · never sent to a model</label>
    <div className="replay-prompt__field">
      <input id={`${trace.slug}-replay-prompt`} value={prompt} onChange={(event) => { setPrompt(event.target.value); setEnhanced(false); }} />
      <button type="button" onClick={() => setEnhanced(true)} disabled={!prompt.trim()}>{enhanced ? "Preview updated" : "Frame preview"}</button>
    </div>
    {modelOpen && <div className="prompt-model-menu" role="status">No model is selected. Replay uses the recorded fixture and never sends this input over the network.</div>}
    {enhanced && <p className="replay-prompt__note">Preview-only framing: the fixture is unchanged and no inference request was made.</p>}
  </div>;
}

export function PlanList({ items }: { items: PlanItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="plan-list">
    <button className="plan-list__header" type="button" aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>
      <span><span className="plan-list__icon" aria-hidden="true">✓</span> Search plan</span><span>{collapsed ? "Show" : "Hide"} {items.length} steps</span>
    </button>
    {!collapsed && <ol>{items.map((item, index) => <li key={item.label}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><p>{item.detail}</p></div></li>)}</ol>}
  </div>;
}

export function SourceFooter({ sources, label = "Example provenance · curated fixture" }: { sources: SourceRef[]; label?: string }) {
  return <div className="source-footer"><div className="source-footer__label"><span className="lab-kicker">{label}</span><span>{sources.length} references</span></div><div className="source-footer__items">{sources.map((source) => <details key={source.id}><summary><span className="source-mark">{source.id}</span>{source.label}</summary><p>{source.detail}</p></details>)}</div></div>;
}

export function StructuredTable({ title, rows }: { title: string; rows: TableRow[] }) {
  return <div className="structured-table"><div className="structured-table__heading"><span className="lab-kicker">Structured output</span><strong>{title}</strong></div><div className="structured-table__scroll"><table><thead><tr><th>Chunk / field</th><th>Selection</th><th>Why it matters</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td><td>{row.detail}</td></tr>)}</tbody></table></div></div>;
}

export function DiffCard({ file, rows }: { file: string; rows: DiffRow[] }) {
  const added = rows.filter((row) => row.type === "add").length;
  const removed = rows.filter((row) => row.type === "remove").length;
  return <div className="diff-card"><div className="diff-card__header"><span><span aria-hidden="true">⌘</span> {file}</span><span className="diff-card__stats"><b>+{added}</b> <i>-{removed}</i></span></div><div className="diff-card__body">{rows.map((row, index) => <div className={`diff-row diff-row--${row.type}`} key={`${row.text}-${index}`}><span>{row.old ?? ""}</span><span>{row.current ?? ""}</span><b aria-hidden="true">{row.type === "add" ? "+" : row.type === "remove" ? "−" : " "}</b><code>{row.text}</code></div>)}</div></div>;
}

export function TrustSlide({ file, rows }: { file: string; rows: DiffRow[] }) {
  const [revealed, setRevealed] = useState(false);
  return <div className={`trust-slide${revealed ? " is-revealed" : ""}`}>
    {!revealed ? <>
      <div><span className="lab-kicker">Generated-code boundary</span><strong>Reveal the safe replay detail</strong><p>This control only reveals a curated diff. It never executes generated Python.</p></div>
      <button type="button" className="trust-slide__track" aria-expanded={revealed} onClick={() => setRevealed(true)}><span>Inspect curated diff <b aria-hidden="true">→</b></span></button>
    </> : <div className="trust-slide__revealed"><div><span className="lab-kicker">Inspection mode · no execution</span><strong>Generated module, represented as data</strong></div><DiffCard file={file} rows={rows} /><button type="button" className="trust-slide__reset" onClick={() => setRevealed(false)}>Hide detail</button></div>}
  </div>;
}

export function StreamingOutput({ text, ready }: { text: string; ready: boolean }) {
  const [shown, setShown] = useState(ready ? text : "");
  const previous = useRef(ready);
  useEffect(() => {
    if (!ready) { setShown(""); previous.current = false; return; }
    if (previous.current) return;
    previous.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(text); return; }
    let index = 0;
    const timer = window.setInterval(() => { index += 3; setShown(text.slice(0, index)); if (index >= text.length) window.clearInterval(timer); }, 16);
    return () => window.clearInterval(timer);
  }, [ready, text]);
  return <p className="streaming-output">{ready ? shown : "Output appears when the observable run reaches its final stage."}{ready && shown.length < text.length && <span className="streaming-output__caret" aria-hidden="true" />}</p>;
}

export function SystemCarousel({ traces }: { traces: LabTrace[] }) {
  const [index, setIndex] = useState(0);
  const trace = traces[index];
  const move = (delta: number) => setIndex((value) => (value + delta + traces.length) % traces.length);
  return <div className="system-carousel" aria-label="AI Lab system carousel"><div className="system-carousel__controls"><span className="lab-kicker" aria-live="polite">Architecture index · {String(index + 1).padStart(2, "0")} / {String(traces.length).padStart(2, "0")}</span><div><button type="button" aria-label="Previous system" onClick={() => move(-1)}>←</button><button type="button" aria-label="Next system" onClick={() => move(1)}>→</button></div></div><article className="system-carousel__card"><div><span className="project-meta">{trace.mode} · {trace.fixtureLabel}</span><h3>{trace.runLabel}</h3><p>{trace.caveat}</p></div><div className="system-carousel__events">{trace.events.slice(0, 3).map((event: TraceEvent) => <span key={event.id}>{event.kind}<b>{event.label}</b></span>)}</div></article></div>;
}
