export const SITE_URL = "https://shubhangmall.com";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
