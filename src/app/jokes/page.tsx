import Link from "next/link";
import { JokeCard } from "@/components/joke-card";
import { fetchJokes, type JokeFilter } from "@/lib/jokes";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jokes" };

const FILTERS: { key: JokeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "record", label: "The record" },
  { key: "members", label: "Members" },
];

export default async function JokesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.filter) ? sp.filter : "all") as JokeFilter;
  const highlight = sp.new ? Number(sp.new) : null;
  const [{ user }, jokes] = await Promise.all([getUserAndProfile(), fetchJokes(filter)]);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-8 pt-32 md:px-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[560px]">
          <p className="eyebrow">The list</p>
          <h1 className="t-h1 mt-3">Columbia Jokes</h1>
          <p className="t-lg mt-4 text-[color:var(--ink-60)]">
            {jokes.length} print{jokes.length === 1 ? "" : "s"}. Tap a setup for its punchline.
            {user ? " Laugh at the ones that land." : " Sign in to laugh at the ones that land."}
          </p>
        </div>
        <nav className="pill flex h-12 max-w-full items-center gap-1 self-start overflow-x-auto px-2 font-jak text-[14px] font-medium" aria-label="Filter">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/jokes" : `/jokes?filter=${f.key}`}
              aria-current={filter === f.key ? "page" : undefined}
              className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 transition-colors ${
                filter === f.key ? "bg-ink text-paper" : "text-[color:var(--ink-60)] hover:text-oxblood"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {jokes.length === 0 ? (
        <div className="card mt-12 flex flex-col items-start gap-4 p-8">
          <h2 className="t-h3">Nothing printed here yet.</h2>
          <p className="text-[color:var(--ink-60)]">Be the first member to put one on the press.</p>
          <Link href={user ? "/write" : "/login"} className="btn btn-ink">
            {user ? "Write one" : "Sign in to write one"}
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {jokes.map((j, i) => (
            <JokeCard key={j.id} joke={j} index={Math.min(i, 8)} canLaugh={Boolean(user)} highlight={highlight === j.id} />
          ))}
        </div>
      )}

      {user && (
        <div className="mt-16 flex justify-center">
          <Link href="/write" className="btn btn-ink">
            Print your own
          </Link>
        </div>
      )}
    </main>
  );
}
