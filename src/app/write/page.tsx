import { redirect } from "next/navigation";
import { Composer } from "@/components/composer";
import { DeleteButton } from "@/components/delete-button";
import { JokeCard } from "@/components/joke-card";
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

  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 md:px-16">
      <div className="max-w-[560px]">
        <p className="eyebrow">The press</p>
        <h1 className="t-h1 mt-3">Print your own.</h1>
        <p className="t-lg mt-4 text-[color:var(--ink-60)]">
          A setup, a punchline, and your honest rating. It goes into the list under your byline the moment you press print.
        </p>
      </div>

      <div className="mt-12">
        <Composer
          action={createJoke}
          author={{
            id: profile!.id,
            first_name: profile!.first_name,
            last_name: profile!.last_name,
            avatar_url: profile!.avatar_url,
          }}
          error={error}
        />
      </div>

      {mine.length > 0 && (
        <section className="mt-24">
          <p className="eyebrow">Your prints</p>
          <h2 className="t-h2 mt-3">
            {mine.length} so far, {mine.reduce((s, j) => s + j.laughs, 0)} laugh{mine.reduce((s, j) => s + j.laughs, 0) === 1 ? "" : "s"} between them.
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((j, i) => (
              <div key={j.id} className="flex flex-col gap-2">
                <JokeCard joke={j} index={i} open canLaugh={false} />
                <div className="flex justify-end">
                  <DeleteButton id={j.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
