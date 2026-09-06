import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://shubhangmall.com",
  integrations: [react(), mdx(), sitemap()],
  output: "server",
  adapter: vercel(),
});
