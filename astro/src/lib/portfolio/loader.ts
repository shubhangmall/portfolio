import { getCollection, type CollectionEntry } from "astro:content";
import { identity } from "../../data/site";
import { experience } from "../../data/experience";
import type { PortfolioDocument } from "./types";

function projectDocument(project: CollectionEntry<"projects">): PortfolioDocument {
  const data = project.data;

  return {
    id: data.slug,
    title: data.title,
    text: [data.summary, project.body ?? ""].join("\n"),
    category: data.category,
    technologies: data.technologies,
    source: {
      kind: "project",
      id: data.slug,
      title: data.title,
      path: `/work/${data.slug}/`,
      url: data.projectUrl ?? data.repositoryUrl,
    },
  };
}

function siteDocument(): PortfolioDocument {
  return {
    id: "site-identity",
    title: identity.name,
    text: [identity.headline, identity.intro, ...identity.links.map((link) => link.label)].join("\n"),
    technologies: [],
    source: {
      kind: "site",
      id: "site-identity",
      title: identity.name,
      path: "/",
    },
  };
}

function experienceDocument(entry: (typeof experience)[number]): PortfolioDocument {
  return {
    id: entry.id,
    title: `${entry.role} — ${entry.employer}`,
    text: [entry.employer, entry.role, entry.dateRange, ...entry.details].join("\n"),
    technologies: entry.technologies,
    source: {
      kind: "experience",
      id: entry.id,
      title: `${entry.role} — ${entry.employer}`,
      path: "/#experience",
      url: entry.companyUrl,
    },
    experience: entry,
  };
}

export async function loadPortfolioDocuments(): Promise<PortfolioDocument[]> {
  const projects = await getCollection("projects");
  return [siteDocument(), ...experience.map(experienceDocument), ...projects.map(projectDocument)];
}
