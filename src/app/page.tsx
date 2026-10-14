import { HeroSheets } from "@/components/riso/HeroSheets";
import { Stamp } from "@/components/stamp/Stamp";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      {/* her discs, a cluster at each edge; drag them */}
      <div className="absolute inset-0 hidden md:block">
        <HeroSheets />
      </div>
      <div className="absolute inset-0 md:hidden">
        <HeroSheets narrow />
      </div>

      <div className="pointer-events-none relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-24 md:px-16">
        <div className="grid w-full items-center gap-12 md:grid-cols-[1fr_auto] md:gap-16">
          {/* the words, left */}
          <div className="pointer-events-auto flex max-w-[560px] flex-col items-start gap-6">
            <h1 className="t-display enter" style={{ "--i": 0 } as React.CSSProperties}>
              Columbia Laughs
            </h1>
            <p className="t-lg enter text-[color:var(--ink-60)]" style={{ "--i": 1 } as React.CSSProperties}>
              Who&apos;s Columbia&apos;s funniest student? Could it be you? Generate jokes or write your own. Whoever gets the most lols wins.
            </p>
          </div>

          {/* the stamp, right */}
          <div className="enter pointer-events-auto w-full max-w-[280px] justify-self-start md:w-[320px] md:max-w-none md:justify-self-end" style={{ "--i": 1 } as React.CSSProperties} data-cur="wusup new york">
            <Stamp className="block aspect-[1/1.2] w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
