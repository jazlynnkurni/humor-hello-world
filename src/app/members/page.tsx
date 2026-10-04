import Link from "next/link";
import { redirect } from "next/navigation";
import { JokeCard } from "@/components/joke-card";
import { fetchJokes } from "@/lib/jokes";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members" };

// Only shown to logged-in users. The proxy also redirects anonymous visitors.
export default async function MembersPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (!profileIsComplete(profile)) redirect("/onboarding");

  const all = await fetchJokes("all");
  const best = all.filter((j) => j.rating === 5);

  return (
    <main className="mx-auto max-w-2xl px-6 pt-32 md:px-0">
      <p className="eyebrow">Members only</p>
      <h1 className="t-h1 mt-3">Welcome, {profile!.first_name}.</h1>
      <p className="mt-3 text-[color:var(--ink-60)]">
        This page is gated. Anyone who isn&apos;t signed in gets sent to the login page instead.
      </p>

      {profile!.favorite_joke && (
        <section className="card mt-10 p-6">
          <p className="eyebrow">Your favorite</p>
          <p className="riso-ink mt-2 text-lg">{profile!.favorite_joke}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="eyebrow mb-4">The five-star shelf</h2>
        <div className="flex flex-col gap-4">
          {best.map((j, i) => (
            <JokeCard key={j.id} joke={j} index={i} open canLaugh />
          ))}
        </div>
      </section>

      <div className="mt-10 flex gap-3">
        <Link href="/rate" className="btn btn-ink">
          Rate today&apos;s punchlines
        </Link>
        <Link href="/write" className="btn btn-paper">
          Write a joke
        </Link>
        <Link href="/profile" className="btn btn-paper">
          Edit profile
        </Link>
      </div>
    </main>
  );
}
