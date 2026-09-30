import Link from "next/link";
import { JokeCard } from "@/components/joke-card";
import { fetchJokes } from "@/lib/jokes";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jokes" };

export default async function JokesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const highlight = sp.new ? Number(sp.new) : null;
  const [{ user }, jokes] = await Promise.all([getUserAndProfile(), fetchJokes("all")]);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-8 pt-32 md:px-16">
      <Link href="/" className="t-sm text-[color:var(--ink-60)] hover:text-oxblood">
        ← Home
      </Link>
      <h1 className="t-h1 mt-4">Columbia Jokes</h1>
      <p className="t-sm mt-2 text-[color:var(--ink-60)]">
        {jokes.length} joke{jokes.length === 1 ? "" : "s"} loaded from Supabase, sorted by rating. Written from real r/columbia threads
        {jokes.some((j) => j.author_id) ? ", plus members' own." : "."}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {jokes.map((j, i) => (
          <JokeCard key={j.id} joke={j} index={Math.min(i, 8)} open canLaugh={Boolean(user)} highlight={highlight === j.id} />
        ))}
      </div>

      {user && (
        <div className="mt-12">
          <Link href="/write" className="btn btn-ink">
            Write your own
          </Link>
        </div>
      )}
    </main>
  );
}
