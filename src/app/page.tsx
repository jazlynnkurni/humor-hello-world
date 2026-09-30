import Link from "next/link";
import { JokeRow } from "@/components/joke-row";
import { fetchJokes } from "@/lib/jokes";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ user }, latest] = await Promise.all([getUserAndProfile(), fetchJokes("all", 3)]);

  return (
    <main>
      {/* ---- hero: one dot pressed into a lot of paper ---------------------- */}
      <section className="mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center md:px-16">
        <div className="head center">
          <p className="eyebrow enter" style={{ "--i": 1 } as React.CSSProperties}>
            Morningside Heights, in print
          </p>
          <h1 className="t-display enter max-w-[14ch]" style={{ "--i": 2 } as React.CSSProperties}>
            The jokes that never made it past Sidechat.
          </h1>
          <p className="lede enter max-w-[30em] text-center" style={{ "--i": 3 } as React.CSSProperties}>
            Fifteen written from real r/columbia threads, and whatever members have printed since.
          </p>
        </div>
        <div className="enter mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-2" style={{ "--i": 4 } as React.CSSProperties}>
          <Link href="/jokes" className="arrow-link">
            Read the jokes <Arrow />
          </Link>
          <Link href={user ? "/write" : "/login"} className="arrow-link text-ink-2">
            {user ? "Write one" : "Sign in to write one"} <Arrow />
          </Link>
        </div>
      </section>

      {/* ---- the last three ------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-6 md:px-16">
        <div className="head">
          <p className="eyebrow">Fresh off the press</p>
          <h2 className="t-h2">The last three lines.</h2>
        </div>
        <ul className="rows mt-12">
          {latest.map((j, i) => (
            <JokeRow key={j.id} joke={j} index={i} n={i + 1} canLaugh={Boolean(user)} />
          ))}
        </ul>
        <Link href="/jokes" className="arrow-link mt-8">
          All of them <Arrow />
        </Link>
      </section>

      {/* ---- how it works, three lines --------------------------------------- */}
      <section className="mx-auto mt-24 grid max-w-7xl gap-12 px-6 md:grid-cols-3 md:px-16">
        <Step n="01" title="Read the record">
          Fifteen jokes lifted from real r/columbia threads. Each one links back to where it came from.
        </Step>
        <Step n="02" title="Sign in with a punchline">
          Finish a setup with anything at all. Google is the actual punchline, and yours comes with you.
        </Step>
        <Step n="03" title="Print your own">
          Write a setup and a punchline, watch it set itself, and press it into the list under your name.
        </Step>
      </section>
    </main>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-[color:var(--hair)] pt-6">
      <span className="eyebrow tnum text-ink-3">{n}</span>
      <h3 className="t-h3">{title}</h3>
      <p className="text-ink-2">{children}</p>
    </div>
  );
}

export function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10h14M11 4l6 6-6 6" />
    </svg>
  );
}
