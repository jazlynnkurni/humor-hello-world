"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function bust() {
  revalidatePath("/");
  revalidatePath("/jokes");
  revalidatePath("/members");
  revalidatePath("/write");
}

export async function toggleLaugh(jokeId: number, laughed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (laughed) await supabase.from("laughs").delete().eq("joke_id", jokeId).eq("user_id", user.id);
  else await supabase.from("laughs").insert({ joke_id: jokeId, user_id: user.id });
  bust();
}

export async function createJoke(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const setup = String(formData.get("setup") ?? "").trim().slice(0, 240);
  const punchline = String(formData.get("punchline") ?? "").trim().slice(0, 240);
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 3) || 3));
  if (!setup || !punchline) redirect("/write?error=empty");

  const { data, error } = await supabase
    .from("jokes")
    .insert({ setup, punchline, rating, author_id: user.id })
    .select("id")
    .single();
  if (error) redirect(`/write?error=${encodeURIComponent(error.message)}`);

  bust();
  redirect(`/jokes?new=${data.id}`);
}

export async function deleteJoke(jokeId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("jokes").delete().eq("id", jokeId).eq("author_id", user.id);
  bust();
}
