import Link from "next/link";
import { HeroSheets } from "@/components/riso/HeroSheets";
import { JokeCard } from "@/components/joke-card";
import { fetchJokes } from "@/lib/jokes";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ user }, latest] = await Promise.all([getUserAndProfile(), fetchJokes("all", 3)]);

  return (
    <main>
      {/* ---- hero: the discs beside the words ------------------------------ */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 hidden md:block">
          <HeroSheets />
        </div>
        <div className="absolute inset-0 md:hidden">
          <HeroSheets narrow />
        </div>

        <div className="pointer-events-none relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-6 pb-16 pt-32 md:justify-center md:px-16 md:pb-24">
          <div className="pointer-events-auto max-w-[560px]">
            <p className="eyebrow enter" style={{ "--i": 0 } as React.CSSProperties}>
              Morningside Heights, printed
            </p>
            <h1 className="t-display enter mt-6" style={{ "--i": 1 } as React.CSSProperties}>
              The jokes that never made it past Sidechat.
            </h1>
            <p
              className="t-lg enter mt-6 max-w-[440px] text-[color:var(--ink-60)]"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Fifteen written from real r/columbia threads, and however many members have printed since.
              Drag the discs. They&apos;re yours too.
            </p>
            <div className="enter mt-10 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
              <Link href="/jokes" className="btn btn-ink">
                Read the jokes
              </Link>
              <Link href={user ? "/write" : "/login"} className="btn btn-paper">
                {user ? "Write one" : "Sign in to write one"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- fresh off the press ------------------------------------------ */}
      <section className="mx-auto max-w-7xl px-6 pt-8 md:px-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Fresh off the press</p>
            <h2 className="t-h2 mt-3">The last three prints</h2>
          </div>
          <Link href="/jokes" className="link t-sm hidden sm:inline">
            All of them →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {latest.map((j, i) => (
            <JokeCard key={j.id} joke={j} index={i} canLaugh={Boolean(user)} />
          ))}
        </div>
      </section>

      {/* ---- how it works -------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-6 pt-24 md:px-16">
        <div className="card grid gap-8 p-8 md:grid-cols-3 md:p-12">
          <Step n="01" title="Read the record">
            Fifteen jokes lifted from real r/columbia threads. Each one links back to where it came from.
          </Step>
          <Step n="02" title="Sign in, the fun way">
            Two discs. Drag yours into the other and the overlap is the button. Google does the rest.
          </Step>
          <Step n="03" title="Print your own">
            Write a setup and a punchline, watch it typeset live, and stamp it into the list under your name.
          </Step>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-jak text-[13px] font-medium text-gold">{n}</span>
      <h3 className="t-h3">{title}</h3>
      <p className="text-[color:var(--ink-60)]">{children}</p>
    </div>
  );
}
