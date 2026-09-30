import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  favorite_joke: string | null;
};

export type Viewer = { id: string; email: string | null };

/**
 * Who is looking, and their profile. Cached per request, so the nav and the
 * page share one lookup instead of each asking Supabase again. The session is
 * verified locally from its JWT (getClaims) rather than by a round trip to the
 * auth server on every render; the proxy already refreshed it.
 */
export const getUserAndProfile = cache(async (): Promise<{ user: Viewer | null; profile: Profile | null }> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { user: null, profile: null };
  const user: Viewer = { id: claims.sub, email: (claims.email as string | undefined) ?? null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url, favorite_joke")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile ?? null) as Profile | null };
});

export function profileIsComplete(p: Profile | null) {
  return Boolean(p?.first_name?.trim() && p?.last_name?.trim());
}
