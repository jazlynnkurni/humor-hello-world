import Link from "next/link";
import { Stamp } from "@/components/stamp/Stamp";
import { getUserAndProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { user } = await getUserAndProfile();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center px-6 pb-16 pt-24 md:px-16">
      {/* the stamp: struck card with the crown raised out of it */}
      <div className="enter w-full max-w-[280px] sm:max-w-[320px]" style={{ "--i": 0 } as React.CSSProperties}>
        <Stamp className="block aspect-[1/1.2] w-full" />
      </div>

      <div className="mt-2 flex max-w-[560px] flex-col items-center gap-6 text-center">
        <h1 className="t-display enter" style={{ "--i": 1 } as React.CSSProperties}>
          Columbia Jokes
        </h1>
        <p className="t-lg enter text-[color:var(--ink-60)]" style={{ "--i": 2 } as React.CSSProperties}>
          A new setup every day. Members ask the model for punchlines, everyone votes, the best one wins the day.
        </p>
        <div className="enter flex flex-wrap justify-center gap-3" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/rate" className="btn btn-ink">
            Rate today&apos;s punchlines →
          </Link>
          <Link href="/jokes" className="btn btn-paper">
            See the jokes
          </Link>
          {!user && (
            <Link href="/login" className="btn btn-paper">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
