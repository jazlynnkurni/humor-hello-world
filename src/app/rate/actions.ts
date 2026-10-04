"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generatePunchlines } from "@/lib/ai";
import { setupFor, todayNY } from "@/lib/daily";
import { generationsToday } from "@/lib/rate";

const DAILY_CAP = 5;

async function viewer() {
  const supabase = await createClient();
  const claims = (await supabase.auth.getClaims()).data?.claims;
  return { supabase, userId: claims?.sub ?? null };
}

/** Ask the model for three punchlines and store the prompt, the model, and every candidate. */
export async function generate(formData: FormData) {
  const { supabase, userId } = await viewer();
  if (!userId) redirect("/login");

  const day = todayNY();
  const custom = String(formData.get("setup") ?? "").trim().slice(0, 140);
  const setup = custom || setupFor(day);

  if ((await generationsToday(userId, day)) >= DAILY_CAP) redirect("/rate?error=cap");

  let result: Awaited<ReturnType<typeof generatePunchlines>>;
  try {
    result = await generatePunchlines(setup);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed.";
    redirect(`/rate?error=${encodeURIComponent(msg.slice(0, 160))}`);
  }

  const { data: gen, error } = await supabase
    .from("generations")
    .insert({ user_id: userId, setup, prompt: result.prompt, model: result.model, day })
    .select("id")
    .single();
  if (error) redirect(`/rate?error=${encodeURIComponent(error.message)}`);

  const { error: cErr } = await supabase.from("candidates").insert(result.punchlines.map((p) => ({ generation_id: gen.id, punchline: p })));
  if (cErr) redirect(`/rate?error=${encodeURIComponent(cErr.message)}`);

  revalidatePath("/rate");
  revalidatePath("/");
  redirect(`/rate?new=${gen.id}${custom ? "&view=new" : ""}`);
}

/** One row per member per candidate. Same value again removes it; the other value flips it. */
export async function vote(candidateId: number, value: 1 | -1) {
  const { supabase, userId } = await viewer();
  if (!userId) redirect("/login");

  const { data: existing } = await supabase.from("votes").select("value").eq("candidate_id", candidateId).eq("user_id", userId).maybeSingle();
  if (!existing) await supabase.from("votes").insert({ candidate_id: candidateId, user_id: userId, value });
  else if (existing.value === value) await supabase.from("votes").delete().eq("candidate_id", candidateId).eq("user_id", userId);
  else await supabase.from("votes").update({ value }).eq("candidate_id", candidateId).eq("user_id", userId);

  revalidatePath("/rate");
  revalidatePath("/");
}
