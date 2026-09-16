import { useEffect, useMemo, useState } from "react";
import type { LabTrace } from "../lib/ai-lab";
import "./RunInspector.css";
import { PlanList, ReplayPrompt, ReplayScrubber, SourceFooter, StreamingOutput, StructuredTable, ThinkingState } from "./LabPatterns";

type Props = { trace: LabTrace; compact?: boolean };

export default function RunInspector({ trace, compact = false }: Props) {
  const [visible, setVisible] = useState(compact ? trace.events.length : 1);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const events = useMemo(() => trace.events.slice(0, visible), [trace.events, visible]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (visible >= trace.events.length) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible((count) => count + 1), 650);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, trace.events.length, visible]);

  const replay = () => {
    if (reducedMotion) {
      setVisible(trace.events.length);
      setPlaying(false);
      return;
    }
    setVisible(1);
    setPlaying(true);
  };

  const replayStatus = playing
    ? `Replaying curated trace: ${visible} of ${trace.events.length} observable events shown.`
    : visible >= trace.events.length
      ? "Curated replay complete."
      : "Curated replay ready. Select Replay run to step through observable events.";

  return (
    <section className={`run-inspector${compact ? " run-inspector--compact" : ""}`} aria-labelledby={`${trace.slug}-run-title`} aria-busy={playing}>
      <div className="run-inspector__header">
        <div>
          <p className="lab-kicker">Execution inspector</p>
          <h2 id={`${trace.slug}-run-title`}>{trace.runLabel}</h2>
        </div>
        <button className="replay-button" type="button" onClick={replay}>{playing ? "Restart replay" : "Replay run"}</button>
      </div>
      <p className="run-status" role="status" aria-live="polite">{replayStatus}</p>
      <div className="run-meta" aria-label="Run metadata">
        <span className="mode-badge">● {trace.mode}</span><span>{trace.fixtureLabel}</span><span>{trace.provider}</span><span>{trace.model}</span>
      </div>
      {!compact && <ReplayScrubber value={visible} max={trace.events.length} onChange={(value) => { setVisible(value); setPlaying(false); }} />}
      {!compact && trace.replayPrompt && <ReplayPrompt trace={trace} />}
      <ol className="trace-list" aria-label={`${trace.runLabel} observable events`}>
        {events.map((event, index) => (
          <li className={`trace-event trace-event--${event.status ?? "complete"}`} key={event.id}>
            <span className="trace-event__rail" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></span>
            <div className="trace-event__body">
              <div className="trace-event__topline"><span className={`trace-kind trace-kind--${event.kind}`}>{event.kind}</span><span>{event.meta}</span></div>
              <h3>{event.label}</h3><p>{event.detail}</p>{event.status === "active" && playing && <ThinkingState label="replaying observable stage" />}
            </div>
          </li>
        ))}
      </ol>
      {!compact && visible < trace.events.length && <button className="trace-more" type="button" onClick={() => setVisible((count) => count + 1)}>Show next event</button>}
      {!compact && trace.plan && <PlanList items={trace.plan} />}
      {!compact && trace.structured && <StructuredTable title="Retrieved context" rows={trace.structured} />}
      {!compact && trace.sources && <SourceFooter sources={trace.sources} />}
      <div className="trace-output"><p className="lab-kicker">Observable output</p><StreamingOutput text={trace.output} ready={visible >= trace.events.length} /></div>
      <p className="trace-caveat"><strong>Boundary:</strong> {trace.caveat}</p>
    </section>
  );
}
