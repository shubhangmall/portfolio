import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

export async function* streamGemini(prompt: string): AsyncGenerator<string> {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContentStream({
    model: MODEL,
    contents: prompt,
  });

  for await (const chunk of response) {
    if (chunk.text) yield chunk.text;
  }
}
