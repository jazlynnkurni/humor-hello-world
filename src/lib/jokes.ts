import { createClient } from "@/lib/supabase/server";
import { getUserAndProfile } from "@/lib/profile";

export type Author = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type Joke = {
  id: number;
  setup: string;
  punchline: string;
  rating: number;
  source_url: string | null;
  author_id: string | null;
  created_at: string;
  laughs: number;
  laughed: boolean;
  author: Author | null;
};

export type JokeFilter = "all" | "record" | "members";

type Row = Omit<Joke, "laughs" | "laughed" | "author"> & { laughs: { count: number }[] | null };

/** Every joke, with its laugh count, whether the viewer laughed, and a byline. */
export async function fetchJokes(filter: JokeFilter = "all", limit?: number): Promise<Joke[]> {
  const [supabase, { user }] = await Promise.all([createClient(), getUserAndProfile()]);

  let q = supabase
    .from("jokes")
    .select("id, setup, punchline, rating, source_url, author_id, created_at, laughs(count)")
    .order("created_at", { ascending: false })
    .order("rating", { ascending: false });
  if (filter === "record") q = q.is("author_id", null);
  if (filter === "members") q = q.not("author_id", "is", null);
  if (limit) q = q.limit(limit);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Row[];

  const authorIds = [...new Set(rows.map((r) => r.author_id).filter(Boolean))] as string[];
  const [authorRows, laughRows] = await Promise.all([
    authorIds.length ? supabase.from("authors").select("id, first_name, last_name, avatar_url").in("id", authorIds) : Promise.resolve({ data: [] }),
    user ? supabase.from("laughs").select("joke_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);
  const authors = new Map<string, Author>();
  for (const x of (authorRows.data ?? []) as Author[]) authors.set(x.id, x);
  const mine = new Set<number>();
  for (const x of laughRows.data ?? []) mine.add((x as { joke_id: number }).joke_id);

  return rows.map((r) => ({
    ...r,
    laughs: r.laughs?.[0]?.count ?? 0,
    laughed: mine.has(r.id),
    author: r.author_id ? authors.get(r.author_id) ?? null : null,
  }));
}

/** The jokes one member wrote, newest first. */
export async function fetchMine(userId: string): Promise<Joke[]> {
  const all = await fetchJokes("members");
  return all.filter((j) => j.author_id === userId);
}
