import { redirect } from "next/navigation";
import { Composer } from "@/components/composer";
import { DeleteButton } from "@/components/delete-button";
import { JokeRow } from "@/components/joke-row";
import { createJoke } from "@/app/actions";
import { fetchMine } from "@/lib/jokes";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Write" };

export default async function WritePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (!profileIsComplete(profile)) redirect("/onboarding");
  const [{ error }, mine] = await Promise.all([searchParams, fetchMine(user.id)]);
  const laughs = mine.reduce((s, j) => s + j.laughs, 0);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-40 md:px-16">
      <div className="head">
        <p className="eyebrow">The press</p>
        <h1 className="t-h1">Print your own.</h1>
        <p className="lede">A setup, a punchline, and your honest rating. It goes into the list under your byline the moment you press print.</p>
      </div>

      <div className="mt-16">
        <Composer
          action={createJoke}
          author={{ id: profile!.id, first_name: profile!.first_name, last_name: profile!.last_name, avatar_url: profile!.avatar_url }}
          error={error}
        />
      </div>

      {mine.length > 0 && (
        <section className="mt-24">
          <div className="head">
            <p className="eyebrow">Your lines</p>
            <h2 className="t-h2">
              {mine.length} so far, {laughs} laugh{laughs === 1 ? "" : "s"} between them.
            </h2>
          </div>
          <ul className="rows mt-12">
            {mine.map((j, i) => (
              <li key={j.id} className="relative">
                <ul>
                  <JokeRow joke={j} index={i} n={i + 1} open canLaugh={false} />
                </ul>
                <div className="absolute right-0 top-8 md:top-16">
                  <DeleteButton id={j.id} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
