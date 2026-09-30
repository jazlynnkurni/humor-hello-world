import Link from "next/link";
import { HeroSheets } from "@/components/riso/HeroSheets";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { user } = await getUserAndProfile();

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 hidden md:block">
        <HeroSheets />
      </div>
      <div className="absolute inset-0 md:hidden">
        <HeroSheets narrow />
      </div>

      <div className="pointer-events-none relative mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-6 pb-16 pt-32 md:justify-center md:px-16">
        <div className="pointer-events-auto flex max-w-[560px] flex-col items-start gap-6">
          <h1 className="t-display enter" style={{ "--i": 0 } as React.CSSProperties}>
            Columbia Jokes
          </h1>
          <p className="t-lg enter text-[color:var(--ink-60)]" style={{ "--i": 1 } as React.CSSProperties}>
            Written from real r/columbia threads, and whatever members have added since.
          </p>
          <div className="enter flex flex-wrap gap-3" style={{ "--i": 2 } as React.CSSProperties}>
            <Link href="/jokes" className="btn btn-ink">
              See the jokes →
            </Link>
            {!user && (
              <Link href="/login" className="btn btn-paper">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
