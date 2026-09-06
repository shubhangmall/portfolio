import type { PortfolioDocument, PortfolioSearchResult } from "./types";

const STOP_WORDS = new Set(["a", "about", "an", "and", "for", "in", "my", "of", "the", "to"]);
const EXPERIENCE_TERMS = new Set(["career", "employer", "experience", "job", "worked", "work"]);

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9+#.-]+/g, " ").trim();
}

function terms(query: string): string[] {
  return [...new Set(normalize(query).split(/\s+/).filter((term) => term && !STOP_WORDS.has(term)))];
}

function scoreDocument(document: PortfolioDocument, queryTerms: string[]): PortfolioSearchResult | null {
  const title = normalize(document.title);
  const text = normalize(document.text);
  const category = normalize(document.category ?? "");
  const technologies = normalize(document.technologies.join(" "));
  let score = 0;
  const matchedFields = new Set<PortfolioSearchResult["matchedFields"][number]>();

  for (const term of queryTerms) {
    if (document.source.kind === "experience" && EXPERIENCE_TERMS.has(term)) {
      score += 5;
      matchedFields.add("text");
    }
    if (title.includes(term)) {
      score += title === term ? 12 : 8;
      matchedFields.add("title");
    }
    if (category.includes(term)) {
      score += 6;
      matchedFields.add("category");
    }
    if (technologies.includes(term)) {
      score += 6;
      matchedFields.add("technologies");
    }
    if (text.includes(term)) {
      score += 3;
      matchedFields.add("text");
    }
  }

  if (score === 0) return null;

  return { document, score, matchedFields: [...matchedFields] };
}

export function searchPortfolioDocuments(
  documents: readonly PortfolioDocument[],
  query: string,
  limit = 5,
): PortfolioSearchResult[] {
  const queryTerms = terms(query);
  if (queryTerms.length === 0 || limit <= 0) return [];

  return documents
    .map((document) => scoreDocument(document, queryTerms))
    .filter((result): result is PortfolioSearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title))
    .slice(0, limit);
}
