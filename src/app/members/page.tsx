import Link from "next/link";
import { redirect } from "next/navigation";
import { JokeRow } from "@/components/joke-row";
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
    <main className="mx-auto max-w-7xl px-6 pt-40 md:px-16">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="head">
          <p className="eyebrow">Members only</p>
          <h1 className="t-h1">Your desk, {profile!.first_name}.</h1>
          <p className="lede">This page is gated. Anyone who isn&apos;t signed in is sent to the login instead.</p>
        </div>
        <Link href="/write" className="btn btn-ink self-start">
          Print a new one
        </Link>
      </div>

      <div className="mt-16 grid gap-12 border-t border-[color:var(--hair)] pt-8 sm:grid-cols-3">
        <Stat n={mine.length} label={mine.length === 1 ? "line under your name" : "lines under your name"} i={0} />
        <Stat n={laughsGot} label={laughsGot === 1 ? "laugh received" : "laughs received"} i={1} />
        <Stat n={laughsGiven} label={laughsGiven === 1 ? "laugh given" : "laughs given"} i={2} />
      </div>

      {profile!.favorite_joke && (
        <section className="enter mt-24" style={{ "--i": 3 } as React.CSSProperties}>
          <p className="eyebrow">Your favorite</p>
          <p className="mt-4 max-w-[30em] text-[25px] font-light leading-[1.35]">{profile!.favorite_joke}</p>
        </section>
      )}

      <section className="mt-24">
        <div className="head">
          <p className="eyebrow">Most laughed at</p>
          <h2 className="t-h2">What&apos;s landing.</h2>
        </div>
        <ul className="rows mt-12">
          {top.map((j, i) => (
            <JokeRow key={j.id} joke={j} index={i} n={i + 1} canLaugh />
          ))}
        </ul>
      </section>

      {mine.length > 0 && (
        <section className="mt-24">
          <div className="head">
            <p className="eyebrow">Yours</p>
            <h2 className="t-h2">Under your byline.</h2>
          </div>
          <ul className="rows mt-12">
            {mine.map((j, i) => (
              <JokeRow key={j.id} joke={j} index={i} n={i + 1} open canLaugh={false} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Stat({ n, label, i }: { n: number; label: string; i: number }) {
  return (
    <div className="enter flex flex-col gap-2" style={{ "--i": i } as React.CSSProperties}>
      <span className="tnum text-[61px] font-extralight leading-none tracking-[-0.02em]">{n}</span>
      <span className="t-sm text-ink-2">{label}</span>
    </div>
  );
}
