import Link from "next/link";
import { redirect } from "next/navigation";
import { CandidateCard } from "@/components/candidate-card";
import { Composer } from "@/components/composer";
import { DeleteButton } from "@/components/delete-button";
import { GenerateForm } from "@/components/generate-form";
import { JokeCard } from "@/components/joke-card";
import { createJoke } from "@/app/actions";
import { setupFor, todayNY } from "@/lib/daily";
import { fetchMine } from "@/lib/jokes";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";
import { fetchCandidates, generationsToday, type View } from "@/lib/rate";
import { generate } from "./rate-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Write" };

const VIEWS: { key: View; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "best", label: "All-time best" },
  { key: "new", label: "New" },
];

/**
 * One page for making things: the daily setup with the model's punchlines
 * and the votes on them, then your own jokes. Anyone can read; the actions
 * send a visitor to sign in.
 */
export default async function WritePage({ searchParams }: { searchParams: Promise<{ view?: string; new?: string; error?: string }> }) {
  const sp = await searchParams;
  const view = (VIEWS.some((v) => v.key === sp.view) ? sp.view : "today") as View;
  const highlight = sp.new ? Number(sp.new) : null;
  const day = todayNY();
  const setup = setupFor(day);

  const { user, profile } = await getUserAndProfile();
  if (user && !profileIsComplete(profile)) redirect("/onboarding");
  const member = Boolean(user && profileIsComplete(profile));
  const [cands, used, mine] = await Promise.all([
    fetchCandidates(view, day),
    user ? generationsToday(user.id, day) : Promise.resolve(0),
    user ? fetchMine(user.id) : Promise.resolve([]),
  ]);
  const leader = view === "today" ? cands.find((c) => c.score > 0) : undefined;

  return (
    <main className="mx-auto max-w-7xl px-6 pb-8 pt-32 md:px-16">
      {/* ---- today's setup ------------------------------------------------- */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[640px]">
          <p className="eyebrow">Today&apos;s setup</p>
          <h1 className="t-h1 mt-3">{setup}</h1>
          <p className="t-sm mt-3 text-[color:var(--ink-60)]">
            A new setup every day at midnight, New York time. Members ask the model for three punchlines, everyone signed in votes, the best one wins the day.
          </p>
        </div>
        <nav className="pill flex h-12 items-center gap-1 self-start px-2 font-jak text-[14px] font-medium" aria-label="View">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={v.key === "today" ? "/write" : `/write?view=${v.key}`}
              aria-current={view === v.key ? "page" : undefined}
              className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 transition-colors ${view === v.key ? "bg-ink text-paper" : "text-[color:var(--ink-60)] hover:text-oxblood"}`}
            >
              {v.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-10">
        {member ? (
          <GenerateForm action={generate} setup={setup} left={Math.max(0, 5 - used)} />
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-[color:var(--ink-60)]">Sign in to generate punchlines, vote on them, and write your own.</p>
            <Link href="/login" className="btn btn-ink">
              Sign in
            </Link>
          </div>
        )}
        {sp.error && (
          <p className="t-sm mt-3 text-oxblood">
            {sp.error === "cap" ? "You've used today's five generations. Vote on the others and come back tomorrow." : sp.error === "empty" ? "Both lines are required." : decodeURIComponent(sp.error)}
          </p>
        )}
      </div>

      {leader && (
        <section className="mt-12">
          <p className="eyebrow">Leading today</p>
          <p className="mt-3 max-w-[720px] font-jak text-[25px] font-semibold leading-[1.3]">{leader.punchline}</p>
        </section>
      )}

      {cands.length === 0 ? (
        <div className="card mt-12 flex flex-col items-start gap-3 p-8">
          <h2 className="t-h3">Nothing to rate yet.</h2>
          <p className="text-[color:var(--ink-60)]">{view === "today" ? "Be the first to ask for three punchlines on today's setup." : "Nothing has been generated yet."}</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cands.map((c, i) => (
            <CandidateCard key={c.id} c={c} index={i} canVote={member} highlight={highlight === c.generation.id} showSetup={view !== "today"} />
          ))}
        </div>
      )}

      {/* ---- your own ------------------------------------------------------- */}
      {member && (
        <section className="mt-24 border-t border-[color:var(--ink-12)] pt-16">
          <p className="eyebrow">Your own</p>
          <h2 className="t-h2 mt-3">Write a joke</h2>
          <p className="mt-2 text-[color:var(--ink-60)]">A setup, a punchline, and your honest rating. It goes into the list under your name.</p>

          <div className="mt-10">
            <Composer
              action={createJoke}
              author={{ id: profile!.id, first_name: profile!.first_name, last_name: profile!.last_name, avatar_url: profile!.avatar_url }}
            />
          </div>

          {mine.length > 0 && (
            <div className="mt-16">
              <h3 className="eyebrow mb-4">Your jokes</h3>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {mine.map((j, i) => (
                  <div key={j.id} className="flex flex-col gap-2">
                    <JokeCard joke={j} index={i} open canLaugh={false} />
                    <div className="flex justify-end">
                      <DeleteButton id={j.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
