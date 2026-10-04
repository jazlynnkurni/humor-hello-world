import { generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * The model. With a Gemini API key set, Gemini 3.5 Flash is called directly,
 * falling back to 3.1 Flash Lite if it is overloaded. Without a key, the plain
 * "google/..." string routes through Vercel AI Gateway with the deployment's
 * own identity. Either way, no key in the repo. (2.5 Flash is closed to new
 * API users as of October 2026.)
 */
const PRIMARY = "gemini-3.5-flash";
const FALLBACK = "gemini-3.1-flash-lite";
export const MODEL_ID = `google/${PRIMARY}`;

function model(id: string): LanguageModel {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (key) return createGoogleGenerativeAI({ apiKey: key })(id);
  return `google/${id}`;
}

export function buildPrompt(setup: string) {
  return [
    "You write punchlines for Columbia Jokes, a humor site for Columbia University students in New York.",
    "The reader is a junior, new to the city, living in the dorms, exploring on weekends, chronically online.",
    `Setup: "${setup}"`,
    "Write exactly 3 different punchlines about the setup.",
    "Rules: each is a complete sentence that reads on its own, since it is shown as a card under the setup. Do not start mid-sentence. Each under 22 words. Specific to Columbia or New York. Dry, not corny. No hashtags, no emoji, no slurs, nothing cruel about a real person. PG-13.",
    "Return ONLY a JSON array of 3 strings.",
  ].join("\n");
}

export async function generatePunchlines(setup: string): Promise<{ punchlines: string[]; prompt: string; model: string }> {
  const prompt = buildPrompt(setup);
  /* Gemini 2.5 thinks by default and bills those tokens against maxOutputTokens, so a
     small budget can come back empty. Thinking off: three one-liners do not need it. */
  const ask = (id: string) =>
    generateText({
      model: model(id),
      prompt,
      maxOutputTokens: 1200,
      temperature: 0.9,
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    });
  let used = PRIMARY;
  let text: string;
  try {
    ({ text } = await ask(PRIMARY));
  } catch {
    used = FALLBACK;
    ({ text } = await ask(FALLBACK));
  }

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
  return { punchlines, prompt, model: `google/${used}` };
}
