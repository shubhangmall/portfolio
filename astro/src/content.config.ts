import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    category: z.string(),
    portfolioTitle: z.string().optional(),
    technologies: z.array(z.string()).default([]),
    image: z.string().optional(),
    projectUrl: z.url().optional(),
    repositoryUrl: z.url().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    date: z.coerce.date().optional(),
    topic: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(["Draft", "Upcoming"]),
    relatedProject: z.string().optional(),
  }),
});

export const collections = { projects, notes };
