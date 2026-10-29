import { generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";

/**
 * Generation is driven by tables, not constants, so the admin area can change
 * it without a deploy: which providers and models to try (llm_providers,
 * llm_models, in priority order), which prompt chain to run (prompt_chains,
 * weighted by mix_weight), what each step says (prompt_chain_steps), the
 * Columbia vocabulary and the few-shot examples the templates pull in (terms,
 * generation_examples). Every call to a model, good or bad, is returned as a
 * response record for the caller to store in llm_responses.
 */

export type ModelRow = { id: number; model_id: string; label: string | null; priority: number; timeout_ms: number; max_output_tokens: number; temperature: number; enabled: boolean; provider: { slug: string; env_key: string | null; base_url: string | null; enabled: boolean } | null };
export type StepRow = { id: number; position: number; name: string; template: string };
export type ChainRow = { id: number; name: string; mix_weight: number; enabled: boolean; steps: StepRow[] };
export type ResponseRecord = { chain_id: number | null; step_name: string; provider: string | null; model: string; status: "ok" | "error"; latency_ms: number; prompt: string; raw_text: string | null; error: string | null };
export type Generated = { punchlines: string[]; prompt: string; model: string; chainId: number | null; chainName: string; responses: ResponseRecord[] };

/* what the app did before any of this existed; used only if the tables are empty */
const FALLBACK_MODELS = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
const FALLBACK_TEMPLATE = [
  "You write punchlines for Columbia Laughs, a humor site for Columbia University students in New York.",
  "The reader is a junior, new to the city, living in the dorms, exploring on weekends, chronically online.",
  'Setup: "{{setup}}"',
  "Write exactly 3 different punchlines about the setup.",
  "Rules: each is a complete sentence that reads on its own, since it is shown as a card under the setup. Do not start mid-sentence. Each under 22 words. Specific to Columbia or New York. Dry, not corny. No hashtags, no emoji, no slurs, nothing cruel about a real person. PG-13.",
  "Return ONLY a JSON array of 3 strings.",
].join("\n");

export async function loadConfig() {
  const supabase = await createClient();
  const [models, chains, terms, examples] = await Promise.all([
    supabase.from("llm_models").select("id, model_id, label, priority, timeout_ms, max_output_tokens, temperature, enabled, provider:llm_providers(slug, env_key, base_url, enabled)").eq("enabled", true).order("priority"),
    supabase.from("prompt_chains").select("id, name, mix_weight, enabled, steps:prompt_chain_steps(id, position, name, template)").eq("enabled", true).gt("mix_weight", 0),
    supabase.from("terms").select("term, kind").eq("enabled", true),
    supabase.from("generation_examples").select("setup, punchline").eq("enabled", true),
  ]);
  const ms = ((models.data ?? []) as unknown as ModelRow[]).filter((m) => m.provider?.enabled !== false);
  const cs = ((chains.data ?? []) as unknown as ChainRow[]).map((c) => ({ ...c, steps: [...(c.steps ?? [])].sort((a, b) => a.position - b.position) })).filter((c) => c.steps.length);
  const ts = (terms.data ?? []) as { term: string; kind: string }[];
  return {
    models: ms,
    chains: cs,
    flavor: ts.filter((t) => t.kind === "flavor").map((t) => t.term),
    banned: ts.filter((t) => t.kind === "banned").map((t) => t.term),
    examples: (examples.data ?? []) as { setup: string; punchline: string }[],
  };
}

/** Weighted pick across enabled chains; the mix the admin set. */
export function pickChain(chains: ChainRow[]): ChainRow | null {
  const total = chains.reduce((s, c) => s + c.mix_weight, 0);
  if (!total) return null;
  let r = Math.random() * total;
  for (const c of chains) { r -= c.mix_weight; if (r < 0) return c; }
  return chains[chains.length - 1];
}

export function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

function modelFor(m: ModelRow): LanguageModel {
  const slug = m.provider?.slug ?? "google";
  const key = m.provider?.env_key ? process.env[m.provider.env_key] : process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (slug === "google" && key) return createGoogleGenerativeAI({ apiKey: key, ...(m.provider?.base_url ? { baseURL: m.provider.base_url } : {}) })(m.model_id);
  return `${slug}/${m.model_id}`; /* anything else routes through Vercel AI Gateway */
}

function parseList(text: string, n: number): string[] {
  let out: string[] = [];
  const m = text.match(/\[[\s\S]*\]/);
  if (m) { try { out = (JSON.parse(m[0]) as unknown[]).map(String); } catch {} }
  if (out.length === 0) out = text.split("\n").map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim()).filter((l) => l.length > 3);
  return [...new Set(out.map((p) => p.trim()).filter(Boolean))].slice(0, n);
}

/** One step: try each enabled model in priority order until one answers. Every attempt is recorded. */
async function callStep(prompt: string, models: ModelRow[], chainId: number | null, stepName: string, responses: ResponseRecord[]) {
  let lastErr = "";
  for (const m of models) {
    const t0 = Date.now();
    try {
      const { text } = await generateText({
        model: modelFor(m),
        prompt,
        maxOutputTokens: m.max_output_tokens,
        temperature: Number(m.temperature),
        abortSignal: AbortSignal.timeout(m.timeout_ms),
        providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
      });
      responses.push({ chain_id: chainId, step_name: stepName, provider: m.provider?.slug ?? null, model: m.model_id, status: "ok", latency_ms: Date.now() - t0, prompt, raw_text: text, error: null });
      return { text, model: `${m.provider?.slug ?? "google"}/${m.model_id}` };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      responses.push({ chain_id: chainId, step_name: stepName, provider: m.provider?.slug ?? null, model: m.model_id, status: "error", latency_ms: Date.now() - t0, prompt, raw_text: null, error: lastErr.slice(0, 2000) });
    }
  }
  throw new Error(/demand|overloaded|503|429|timeout|abort/i.test(lastErr) ? "Google's models are overloaded right now. Try again in a minute." : lastErr || "Generation failed.");
}

export async function generatePunchlines(setup: string, chainIdWanted?: number): Promise<Generated> {
  const cfg = await loadConfig();
  const models: ModelRow[] = cfg.models.length
    ? cfg.models
    : FALLBACK_MODELS.map((id, i) => ({ id: -i, model_id: id, label: null, priority: i, timeout_ms: 12000, max_output_tokens: 1200, temperature: 0.9, enabled: true, provider: { slug: "google", env_key: "GOOGLE_GENERATIVE_AI_API_KEY", base_url: null, enabled: true } }));
  const chain: ChainRow = (chainIdWanted && cfg.chains.find((c) => c.id === chainIdWanted)) || pickChain(cfg.chains) || { id: 0, name: "built-in", mix_weight: 1, enabled: true, steps: [{ id: 0, position: 1, name: "Write", template: FALLBACK_TEMPLATE }] };
  const chainId = chain.id || null;

  const vars: Record<string, string> = {
    setup,
    terms: cfg.flavor.join(", ") || "Columbia University, New York",
    banned: cfg.banned.join(", ") || "nothing in particular",
    examples: cfg.examples.map((e) => `Setup: "${e.setup}" → "${e.punchline}"`).join("\n") || "(none)",
    previous: "",
  };

  const responses: ResponseRecord[] = [];
  const prompts: string[] = [];
  let text = "", model = "";
  for (const step of chain.steps) {
    const prompt = render(step.template, vars);
    prompts.push(chain.steps.length > 1 ? `## ${step.name}\n${prompt}` : prompt);
    ({ text, model } = await callStep(prompt, models, chainId, step.name, responses));
    vars.previous = parseList(text, 12).map((p, i) => `${i + 1}. ${p}`).join("\n") || text;
  }

  const punchlines = parseList(text, 3);
  if (punchlines.length === 0) throw new Error("The model returned nothing usable. Try again.");
  return { punchlines, prompt: prompts.join("\n\n"), model, chainId, chainName: chain.name, responses };
}
