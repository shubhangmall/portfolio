import { loadPortfolioDocuments } from "./loader";
import { searchPortfolioDocuments } from "./search";
import type { PortfolioSearchResult } from "./types";

export async function searchPortfolio(query: string, limit = 5): Promise<PortfolioSearchResult[]> {
  const documents = await loadPortfolioDocuments();
  return searchPortfolioDocuments(documents, query, limit);
}

export { loadPortfolioDocuments, searchPortfolioDocuments };
export type {
  ExperienceRecord,
  PortfolioDocument,
  PortfolioSearchResult,
  PortfolioSource,
  PortfolioSourceKind,
} from "./types";
