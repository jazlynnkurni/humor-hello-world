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
      <h1 className="t-h1">Write a joke</h1>
      <p className="mt-2 text-[color:var(--ink-60)]">A setup, a punchline, and your honest rating. It goes into the list under your name.</p>

      <div className="mt-10">
        <Composer
          action={createJoke}
          author={{ id: profile!.id, first_name: profile!.first_name, last_name: profile!.last_name, avatar_url: profile!.avatar_url }}
          error={error}
        />
      </div>

      {mine.length > 0 && (
        <section className="mt-16">
          <h2 className="eyebrow mb-4">Your jokes</h2>
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
        </section>
      )}
    </main>
  );
}
