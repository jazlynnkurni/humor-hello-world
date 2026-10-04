import { createClient } from "@/lib/supabase/server";
import { getUserAndProfile } from "@/lib/profile";
import type { Author } from "@/lib/jokes";

export type Candidate = {
  id: number;
  punchline: string;
  created_at: string;
  generation: { id: number; setup: string; day: string; user_id: string; model: string };
  author: Author | null;
  up: number;
  down: number;
  score: number;
  mine: -1 | 0 | 1;
};

export type View = "today" | "best" | "new";

type Row = {
  id: number;
  punchline: string;
  created_at: string;
  generations: { id: number; setup: string; day: string; user_id: string; model: string } | null;
  votes: { value: number }[] | null;
};

/** Candidates with their tallies, the viewer's own vote, and a byline. */
export async function fetchCandidates(view: View, day: string, limit = 60): Promise<Candidate[]> {
  const [supabase, { user }] = await Promise.all([createClient(), getUserAndProfile()]);

  let q = supabase
    .from("candidates")
    .select("id, punchline, created_at, generations!inner(id, setup, day, user_id, model), votes(value)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (view === "today") q = q.eq("generations.day", day);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Row[];

  const authorIds = [...new Set(rows.map((r) => r.generations?.user_id).filter(Boolean))] as string[];
  const [authorRows, mineRows] = await Promise.all([
    authorIds.length ? supabase.from("authors").select("id, first_name, last_name, avatar_url").in("id", authorIds) : Promise.resolve({ data: [] }),
    user ? supabase.from("votes").select("candidate_id, value").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);
  const authors = new Map<string, Author>();
  for (const a of (authorRows.data ?? []) as Author[]) authors.set(a.id, a);
  const mine = new Map<number, number>();
  for (const v of (mineRows.data ?? []) as { candidate_id: number; value: number }[]) mine.set(v.candidate_id, v.value);

  const out: Candidate[] = rows
    .filter((r) => r.generations)
    .map((r) => {
      const up = (r.votes ?? []).filter((v) => v.value > 0).length;
      const down = (r.votes ?? []).filter((v) => v.value < 0).length;
      return {
        id: r.id,
        punchline: r.punchline,
        created_at: r.created_at,
        generation: r.generations!,
        author: authors.get(r.generations!.user_id) ?? null,
        up,
        down,
        score: up - down,
        mine: (mine.get(r.id) ?? 0) as -1 | 0 | 1,
      };
    });

  if (view !== "new") out.sort((a, b) => b.score - a.score || b.up - a.up || +new Date(b.created_at) - +new Date(a.created_at));
  return out;
}

/** How many times this member has generated today, for the daily cap. */
export async function generationsToday(userId: string, day: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("day", day);
  return count ?? 0;
}
