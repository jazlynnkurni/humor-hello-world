import { generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * The model. On Vercel the plain "google/gemini-2.5-flash" string routes through
 * AI Gateway with the deployment's own identity. If a Gemini API key is set
 * instead, the same model is called directly. Either way, no key in the repo.
 */
export const MODEL_ID = "google/gemini-2.5-flash";

function model(): LanguageModel {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (key) return createGoogleGenerativeAI({ apiKey: key })("gemini-2.5-flash");
  return MODEL_ID;
}

export function buildPrompt(setup: string) {
  return [
    "You write punchlines for Columbia Jokes, a humor site for Columbia University students in New York.",
    "The reader is a junior, new to the city, living in the dorms, exploring on weekends, chronically online.",
    `Setup: "${setup}"`,
    "Write exactly 3 different punchlines that complete or respond to the setup.",
    "Rules: each under 22 words. Specific to Columbia or New York. Dry, not corny. No hashtags, no emoji, no slurs, nothing cruel about a real person. PG-13.",
    "Return ONLY a JSON array of 3 strings.",
  ].join("\n");
}

export async function generatePunchlines(setup: string): Promise<{ punchlines: string[]; prompt: string; model: string }> {
  const prompt = buildPrompt(setup);
  /* Gemini 2.5 thinks by default and bills those tokens against maxOutputTokens, so a
     small budget can come back empty. Thinking off: three one-liners do not need it. */
  const { text } = await generateText({
    model: model(),
    prompt,
    maxOutputTokens: 1200,
    temperature: 0.9,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
  });

  let punchlines: string[] = [];
  const m = text.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      punchlines = (JSON.parse(m[0]) as unknown[]).map(String);
    } catch {}
  }
  if (punchlines.length === 0) {
    punchlines = text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim())
      .filter((l) => l.length > 3);
  }
  punchlines = [...new Set(punchlines.map((p) => p.trim()).filter(Boolean))].slice(0, 3);
  if (punchlines.length === 0) throw new Error("The model returned nothing usable. Try again.");
  return { punchlines, prompt, model: MODEL_ID };
}
