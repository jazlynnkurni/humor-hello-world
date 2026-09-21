import Link from "next/link";
import { supabase, supabaseConfigured, type Joke } from "@/lib/supabase";

// Always fetch fresh rows on each request.
export const dynamic = "force-dynamic";

export const metadata = { title: "Columbia Jokes" };

export default async function JokesPage() {
  if (!supabaseConfigured) {
    return (
      <Shell>
        <p className="text-red-400">
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </Shell>
    );
  }

  const { data, error } = await supabase
    .from("jokes")
    .select("id, setup, punchline, rating, source_url, created_at")
    .order("rating", { ascending: false });

  if (error) {
    return (
      <Shell>
        <p className="text-red-400">Could not load jokes: {error.message}</p>
      </Shell>
    );
  }

  const jokes = (data ?? []) as Joke[];

  return (
    <Shell>
      <p className="mb-8 text-sm text-neutral-400">
        {jokes.length} joke{jokes.length === 1 ? "" : "s"} loaded from
        Supabase, sorted by rating. Written from real r/columbia threads.
      </p>
      <ol className="flex flex-col gap-4">
        {jokes.map((joke, i) => (
          <li
            key={joke.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5"
          >
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span>#{i + 1}</span>
              <span aria-label={`${joke.rating} out of 5`}>
                {"★".repeat(joke.rating)}
                {"☆".repeat(Math.max(0, 5 - joke.rating))}
              </span>
            </div>
            <p className="text-lg font-medium">{joke.setup}</p>
            <p className="mt-2 text-neutral-300">{joke.punchline}</p>
            {joke.source_url && (
              <a
                href={joke.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs text-neutral-500 underline-offset-2 hover:text-neutral-300 hover:underline"
              >
                source thread ↗
              </a>
            )}
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Home
      </Link>
      <h1 className="mb-2 mt-4 text-4xl font-semibold tracking-tight">Columbia Jokes</h1>
      {children}
    </main>
  );
}
