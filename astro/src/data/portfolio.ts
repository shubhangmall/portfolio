export const projectOrder = [
  "engineering-team",
  "deep-research",
  "career-chatbot",
  "agent-creator",
  "financial-researcher",
  "personal-sidekick",
  "stock-picker",
  "first-responder-bodycam",
  "expense-tracker",
  "weather",
  "calculator",
  "apple-cutter",
  "cdrom",
  "induction-motor",
];

export function sortProjects<T extends { data: { slug: string } }>(projects: readonly T[]): T[] {
  const order = new Map(projectOrder.map((slug, index) => [slug, index]));
  return [...projects].sort((left, right) => (order.get(left.data.slug) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.data.slug) ?? Number.MAX_SAFE_INTEGER));
}
