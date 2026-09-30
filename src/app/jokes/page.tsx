import Link from "next/link";
import { JokeRow } from "@/components/joke-row";
import { fetchJokes, type JokeFilter } from "@/lib/jokes";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jokes" };

const FILTERS: { key: JokeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "record", label: "The record" },
  { key: "members", label: "Members" },
];

export default async function JokesPage({ searchParams }: { searchParams: Promise<{ filter?: string; new?: string }> }) {
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.filter) ? sp.filter : "all") as JokeFilter;
  const highlight = sp.new ? Number(sp.new) : null;
  const [{ user }, jokes] = await Promise.all([getUserAndProfile(), fetchJokes(filter)]);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-40 md:px-16">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="head">
          <p className="eyebrow">The list</p>
          <h1 className="t-h1">{jokes.length} lines.</h1>
          <p className="lede">
            Open a setup for its punchline.
            {user ? " Say ha to the ones that land." : " Sign in to say ha to the ones that land."}
          </p>
        </div>
        <nav className="flex items-center gap-2" aria-label="Filter">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/jokes" : `/jokes?filter=${f.key}`}
              aria-current={filter === f.key ? "page" : undefined}
              className={`eyebrow flex h-11 items-center whitespace-nowrap px-2 transition-colors ${filter === f.key ? "border-b border-ink text-ink" : "text-ink-3 hover:text-ink"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {jokes.length === 0 ? (
        <div className="mt-16 border-t border-[color:var(--hair)] pt-8">
          <p className="text-[25px] font-light">Nothing pressed here yet.</p>
          <Link href={user ? "/write" : "/login"} className="arrow-link mt-4">
            {user ? "Write the first" : "Sign in to write the first"}
          </Link>
        </div>
      ) : (
        <ul className="rows mt-16">
          {jokes.map((j, i) => (
            <JokeRow key={j.id} joke={j} index={i} n={i + 1} canLaugh={Boolean(user)} highlight={highlight === j.id} />
          ))}
        </ul>
      )}

      {user && (
        <div className="mt-16">
          <Link href="/write" className="btn btn-ink">
            Print your own
          </Link>
        </div>
      )}
    </main>
  );
}
