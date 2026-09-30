import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  favorite_joke: string | null;
  bio: string | null;
  created_at: string | null;
};

/** What Google told us at sign-in, so the setup step can start from it. */
export type Suggested = { first_name: string | null; last_name: string | null; avatar_url: string | null };
export type Viewer = { id: string; email: string | null; suggested: Suggested };

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
  const meta = (claims.user_metadata ?? {}) as Record<string, string | undefined>;
  const [g, ...rest] = (meta.full_name ?? meta.name ?? "").trim().split(/\s+/);
  const user: Viewer = {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    suggested: {
      first_name: meta.given_name ?? (g || null),
      last_name: meta.family_name ?? (rest.join(" ") || null),
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
    },
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url, favorite_joke, bio, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile ?? null) as Profile | null };
});

export function profileIsComplete(p: Profile | null) {
  return Boolean(p?.first_name?.trim() && p?.last_name?.trim());
}
