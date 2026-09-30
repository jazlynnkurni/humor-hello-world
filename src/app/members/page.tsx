import Link from "next/link";
import { redirect } from "next/navigation";
import { JokeCard } from "@/components/joke-card";
import { fetchJokes, fetchMine } from "@/lib/jokes";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your desk" };

// Only shown to logged-in users. The proxy also redirects anonymous visitors.
export default async function MembersPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (!profileIsComplete(profile)) redirect("/onboarding");

  const [mine, all] = await Promise.all([fetchMine(user.id), fetchJokes("all")]);
  const laughsGiven = all.filter((j) => j.laughed).length;
  const laughsGot = mine.reduce((s, j) => s + j.laughs, 0);
  const top = [...all].sort((a, b) => b.laughs - a.laughs || b.rating - a.rating).slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 md:px-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[560px]">
          <p className="eyebrow">Members only</p>
          <h1 className="t-h1 mt-3">Your desk, {profile!.first_name}.</h1>
          <p className="t-lg mt-4 text-[color:var(--ink-60)]">
            This page is gated. Anyone who isn&apos;t signed in is sent to the login instead.
          </p>
        </div>
        <Link href="/write" className="btn btn-ink self-start">
          Print a new one
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Stat n={mine.length} label={mine.length === 1 ? "print under your name" : "prints under your name"} i={0} />
        <Stat n={laughsGot} label={laughsGot === 1 ? "laugh received" : "laughs received"} i={1} />
        <Stat n={laughsGiven} label={laughsGiven === 1 ? "laugh given" : "laughs given"} i={2} />
      </div>

      {profile!.favorite_joke && (
        <section className="card enter mt-6 p-6" style={{ "--i": 3 } as React.CSSProperties}>
          <p className="eyebrow">Your favorite</p>
          <p className="riso-ink mt-3 text-[20px]">{profile!.favorite_joke}</p>
        </section>
      )}

      <section className="mt-24">
        <p className="eyebrow">Most laughed at</p>
        <h2 className="t-h2 mt-3">What&apos;s landing.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {top.map((j, i) => (
            <JokeCard key={j.id} joke={j} index={i} canLaugh />
          ))}
        </div>
      </section>

      {mine.length > 0 && (
        <section className="mt-24">
          <p className="eyebrow">Yours</p>
          <h2 className="t-h2 mt-3">Under your byline.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((j, i) => (
              <JokeCard key={j.id} joke={j} index={i} open canLaugh={false} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ n, label, i }: { n: number; label: string; i: number }) {
  return (
    <div className="card enter flex flex-col gap-2 p-6" style={{ "--i": i } as React.CSSProperties}>
      <span className="font-jak text-[39px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{n}</span>
      <span className="t-sm text-[color:var(--ink-60)]">{label}</span>
    </div>
  );
}
