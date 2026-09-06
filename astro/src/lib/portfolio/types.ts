export type PortfolioSourceKind = "project" | "site" | "experience";

export interface PortfolioSource {
  kind: PortfolioSourceKind;
  id: string;
  title: string;
  path?: string;
  url?: string;
}

export interface PortfolioDocument {
  id: string;
  title: string;
  text: string;
  category?: string;
  technologies: string[];
  source: PortfolioSource;
  experience?: ExperienceRecord;
}

export interface ExperienceRecord {
  employer: string;
  role: string;
  dateRange: string;
  details: string[];
  technologies: string[];
}

export interface PortfolioSearchResult {
  document: PortfolioDocument;
  score: number;
  matchedFields: Array<"title" | "text" | "category" | "technologies">;
}
