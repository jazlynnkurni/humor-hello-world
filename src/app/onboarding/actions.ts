"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveNames(formData: FormData) {
  const supabase = await createClient();
  const claims = (await supabase.auth.getClaims()).data?.claims;
  const user = claims?.sub ? { id: claims.sub } : null;
  if (!user) redirect("/login");

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const favorite_joke = String(formData.get("favorite_joke") ?? "").trim() || null;
  if (!first_name || !last_name) redirect("/onboarding?error=missing");

  await supabase
    .from("profiles")
    .update({ first_name, last_name, favorite_joke, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  // The nav lives in the shared layout; make it re-render with the new name.
  revalidatePath("/", "layout");
  redirect("/members");
}
