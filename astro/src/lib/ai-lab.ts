export type LabMode = "replay" | "local" | "live";

export type TraceEvent = {
  id: string;
  kind: "stage" | "tool" | "retrieval" | "state" | "output" | "error";
  label: string;
  detail: string;
  meta?: string;
  status?: "complete" | "active" | "degraded";
};

export type LabTrace = {
  slug: string;
  mode: LabMode;
  fixtureLabel: string;
  runLabel: string;
  provider: string;
  model: string;
  events: TraceEvent[];
  output: string;
  caveat: string;
  replayPrompt?: string;
  sources?: { id: string; label: string; detail: string }[];
  plan?: { label: string; detail: string }[];
  structured?: { label: string; value: string; detail: string }[];
  diff?: { file: string; rows: { old?: number; current?: number; type: "context" | "add" | "remove"; text: string }[] };
};

export const labTraces: LabTrace[] = [
  {
    slug: "deep-research",
    mode: "replay",
    fixtureLabel: "Curated replay · synthetic trace",
    runLabel: "Research pipeline / bounded search",
    provider: "Replay fixture",
    model: "Recorded provider boundary",
    events: [
      { id: "dr-1", kind: "stage", label: "Plan searches", detail: "Planner emits a bounded WebSearchPlan (≤ 5 searches).", meta: "structured output", status: "complete" },
      { id: "dr-2", kind: "tool", label: "Concurrent search", detail: "Search tasks run with asyncio.as_completed; one result may fail without stopping the run.", meta: "tool fan-out", status: "complete" },
      { id: "dr-3", kind: "retrieval", label: "Normalize evidence", detail: "Valid URLs become deduplicated ResearchSource records with stable source IDs.", meta: "evidence budget", status: "complete" },
      { id: "dr-4", kind: "output", label: "Stream report", detail: "The writer consumes source-bounded context and yields report chunks.", meta: "streaming", status: "active" },
      { id: "dr-5", kind: "error", label: "Partial search failure", detail: "A failed provider search is logged and the report continues with remaining evidence.", meta: "graceful degradation", status: "degraded" },
    ],
    output: "A grounded report assembled from the evidence that completed. This replay makes the pipeline visible without making a network request.",
    caveat: "The public page does not call the research providers or SendGrid. Live and local execution remain capabilities of the source project.",
    replayPrompt: "Compare provider boundaries for a current research question",
    plan: [
      { label: "Frame the research question", detail: "Turn one request into a bounded set of non-redundant searches." },
      { label: "Run concurrent retrieval", detail: "Fan out to the configured search provider and collect partial results." },
      { label: "Normalize evidence", detail: "Deduplicate valid URLs and preserve source IDs for the writer." },
      { label: "Stream a grounded report", detail: "Write only from the bounded evidence context." },
    ],
    sources: [
      { id: "S1", label: "Tavily result set", detail: "Representative search evidence from the provider boundary; not a live request." },
      { id: "S2", label: "Normalized ResearchSource", detail: "Stable source ID, title, URL, and domain after normalization." },
    ],
  },
  {
    slug: "career-chatbot",
    mode: "replay",
    fixtureLabel: "Curated replay · retrieval inspection",
    runLabel: "RAG retrieval / role-aware context",
    provider: "Replay fixture",
    model: "Embedding boundary recorded",
    events: [
      { id: "cc-1", kind: "stage", label: "Load sources", detail: "Resume PDF and summary text are the indexed source documents.", meta: "ingestion", status: "complete" },
      { id: "cc-2", kind: "state", label: "Check freshness", detail: "A fingerprint covers source metadata, chunking version, and embedding model.", meta: "invalidation", status: "complete" },
      { id: "cc-3", kind: "retrieval", label: "Retrieve top-k", detail: "Chroma returns candidates; the summary is kept and role-level chunks are diversified.", meta: "top-k = 3", status: "active" },
      { id: "cc-4", kind: "tool", label: "Ground response", detail: "Selected chunks become context for the answer; full-context fallback exists when retrieval is insufficient.", meta: "grounding", status: "complete" },
      { id: "cc-5", kind: "output", label: "Structured inspection", detail: "The useful result is not only the answer—it is why these chunks were selected.", meta: "provenance", status: "complete" },
    ],
    output: "Retrieved context: summary + one experience chunk + one skills/education chunk, selected for relevance and diversity.",
    caveat: "This is a retrieval fixture, not a live query against the private resume index. The source app uses OpenAI embeddings and persistent Chroma storage.",
    replayPrompt: "Which experience best demonstrates retrieval-aware engineering?",
    structured: [
      { label: "summary", value: "kept", detail: "Always included when available to ground the persona." },
      { label: "exp_1_role", value: "selected", detail: "Top relevant role-level chunk, with experience diversity enforced." },
      { label: "skills", value: "selected", detail: "Section-aware reranking boosts a clear skills query." },
    ],
    sources: [
      { id: "C1", label: "summary.txt", detail: "Persistent summary chunk included in the retrieval context." },
      { id: "C2", label: "resume.pdf · role chunk", detail: "Role-level chunk created by the current section-aware chunker." },
    ],
  },
  {
    slug: "personal-sidekick",
    mode: "replay",
    fixtureLabel: "Curated replay · state graph",
    runLabel: "Worker → tools → evaluator",
    provider: "Replay fixture",
    model: "gpt-4o-mini boundary recorded",
    events: [
      { id: "ps-1", kind: "state", label: "Initialize state", detail: "Messages, success criteria, feedback, and completion flags enter a checkpointed graph.", meta: "LangGraph state", status: "complete" },
      { id: "ps-2", kind: "stage", label: "Worker", detail: "The worker decides whether the next observable step is a tool call or evaluation.", meta: "conditional edge", status: "complete" },
      { id: "ps-3", kind: "tool", label: "ToolNode", detail: "Tools execute and return messages to the worker node.", meta: "tool boundary", status: "complete" },
      { id: "ps-4", kind: "stage", label: "Evaluator", detail: "Structured feedback decides whether criteria are met or another worker pass is needed.", meta: "typed output", status: "active" },
      { id: "ps-5", kind: "state", label: "Checkpoint / end", detail: "The graph ends on success or user-input-needed; otherwise it retries the worker path.", meta: "MemorySaver", status: "complete" },
    ],
    output: "Evaluator result: criteria met after one tool-assisted worker pass. Observable state is shown; private model reasoning is not.",
    caveat: "The public replay never opens a browser, filesystem, or Python execution tool. Those capabilities stay behind the source project's own trust boundary.",
    replayPrompt: "Plan a small task and show where evaluation can retry",
  },
  {
    slug: "financial-researcher",
    mode: "replay",
    fixtureLabel: "Curated replay · baseline workflow",
    runLabel: "Researcher → analyst",
    provider: "Replay fixture",
    model: "Provider configured by CrewAI project",
    events: [
      { id: "fr-1", kind: "stage", label: "Researcher", detail: "A researcher gathers market information with a tool-enabled CrewAI agent.", meta: "CrewAI sequential", status: "complete" },
      { id: "fr-2", kind: "tool", label: "Market lookup", detail: "The research task passes findings to the downstream analyst task.", meta: "tool call", status: "complete" },
      { id: "fr-3", kind: "output", label: "Analyst report", detail: "The analyst turns research into a concise financial report.", meta: "handoff", status: "active" },
    ],
    output: "A small baseline: sequential research followed by analysis, useful as a contrast with the more elaborate crews.",
    caveat: "This is an educational architecture replay, not investment advice or a live market signal.",
  },
  {
    slug: "engineering-team",
    mode: "replay",
    fixtureLabel: "Curated replay · artifact workflow",
    runLabel: "Lead → implementation → test",
    provider: "Replay fixture",
    model: "CrewAI provider boundary recorded",
    events: [
      { id: "et-1", kind: "stage", label: "Engineering lead", detail: "Frames requirements and coordinates the generated application.", meta: "role", status: "complete" },
      { id: "et-2", kind: "output", label: "Implementation handoff", detail: "Sequential CrewAI tasks pass design and implementation work through backend and frontend roles.", meta: "sequential process", status: "complete" },
      { id: "et-3", kind: "tool", label: "Test boundary", detail: "The project documents sandboxed execution for testing generated output.", meta: "code execution boundary", status: "active" },
      { id: "et-4", kind: "output", label: "Artifacts", detail: "accounts.py, app.py, and tests form the inspectable result.", meta: "generated files", status: "complete" },
    ],
    output: "Artifact set: accounts.py, app.py, and tests/—a tangible handoff rather than a chat transcript.",
    caveat: "Replay shows the documented workflow; it does not execute generated code in the portfolio.",
  },
  {
    slug: "stock-picker",
    mode: "replay",
    fixtureLabel: "Curated replay · hierarchical crew",
    runLabel: "Manager → research → decision",
    provider: "Replay fixture",
    model: "CrewAI provider boundary recorded",
    events: [
      { id: "sp-1", kind: "stage", label: "Manager delegates", detail: "A hierarchical CrewAI manager routes work to specialized agents.", meta: "delegation", status: "complete" },
      { id: "sp-2", kind: "tool", label: "Find companies", detail: "Trending-company research uses a search tool and a typed list output.", meta: "Pydantic output", status: "complete" },
      { id: "sp-3", kind: "retrieval", label: "Research candidates", detail: "Financial research expands the selected companies into structured research records.", meta: "inter-agent handoff", status: "active" },
      { id: "sp-4", kind: "output", label: "Decision report", detail: "The stock picker emits the final report with long-, short-, and entity-memory configured.", meta: "memory", status: "complete" },
    ],
    output: "A delegated decision path with typed intermediate records and configured memory layers.",
    caveat: "The project is an experiment and its output is not reliable investment advice.",
  },
  {
    slug: "agent-creator",
    mode: "replay",
    fixtureLabel: "Curated replay · generated-code boundary",
    runLabel: "Template → generate → register",
    provider: "Replay fixture",
    model: "gpt-4o-mini boundary recorded",
    events: [
      { id: "ac-1", kind: "stage", label: "Creator receives template", detail: "The creator reads agent.py and requests Python code with a fixed class contract.", meta: "AutoGen", status: "complete" },
      { id: "ac-2", kind: "output", label: "Generate agent code", detail: "A model-produced module is written to agentN.py in the source experiment.", meta: "program synthesis", status: "active" },
      { id: "ac-3", kind: "state", label: "Register runtime", detail: "The generated Agent is imported and registered with the runtime.", meta: "dynamic registration", status: "complete" },
      { id: "ac-4", kind: "error", label: "Trust boundary", detail: "Generated Python can execute on the host; the portfolio represents this risk instead of running it.", meta: "security limitation", status: "degraded" },
    ],
    output: "The important result is the boundary: dynamic generation is powerful precisely because generated code must be reviewed and isolated.",
    caveat: "No generated code is executed by this site. The replay is a safe representation of the AutoGen experiment.",
    diff: {
      file: "agent7.py · represented output",
      rows: [
        { old: 1, current: 1, type: "context", text: "class Agent(RoutedAgent):" },
        { old: 2, current: undefined, type: "remove", text: "    system_message = TEMPLATE_MESSAGE" },
        { old: undefined, current: 2, type: "add", text: "    system_message = GENERATED_MESSAGE" },
        { old: 3, current: 3, type: "context", text: "    def __init__(self, name):" },
        { old: 4, current: 4, type: "context", text: "        ..." },
      ],
    },
  },
];

export function getLabTrace(slug: string): LabTrace | undefined {
  return labTraces.find((trace) => trace.slug === slug);
}
