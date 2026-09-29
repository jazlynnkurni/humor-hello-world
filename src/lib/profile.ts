import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  favorite_joke: string | null;
};

export async function getUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url, favorite_joke")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile ?? null) as Profile | null };
}

export function profileIsComplete(p: Profile | null) {
  return Boolean(p?.first_name?.trim() && p?.last_name?.trim());
}
