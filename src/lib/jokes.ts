import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const authors = new Map<string, Author>();
  if (authorIds.length) {
    const { data: a } = await supabase.from("authors").select("id, first_name, last_name, avatar_url").in("id", authorIds);
    for (const x of (a ?? []) as Author[]) authors.set(x.id, x);
  }

  const mine = new Set<number>();
  if (user) {
    const { data: l } = await supabase.from("laughs").select("joke_id").eq("user_id", user.id);
    for (const x of l ?? []) mine.add(x.joke_id as number);
  }

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
