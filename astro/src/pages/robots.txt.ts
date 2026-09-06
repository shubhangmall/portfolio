import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response("User-agent: *\nAllow: /\n\nSitemap: https://shubhangmall.com/sitemap-index.xml\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
