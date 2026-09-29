import { redirect } from "next/navigation";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";
import { supabase as anon, type Joke } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members" };

// Only shown to logged-in users. The proxy also redirects anonymous visitors.
export default async function MembersPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (!profileIsComplete(profile)) redirect("/onboarding");

  const { data } = await anon
    .from("jokes")
    .select("id, setup, punchline, rating")
    .eq("rating", 5)
    .order("id");
  const best = (data ?? []) as Joke[];

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-xs uppercase tracking-widest text-neutral-500">Members only</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Welcome, {profile!.first_name}.
      </h1>
      <p className="mt-3 text-neutral-400">
        This page is gated. Anyone who isn&apos;t signed in gets sent to the
        login page instead.
      </p>

      {profile!.favorite_joke && (
        <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <p className="text-xs text-neutral-500">Your favorite</p>
          <p className="mt-1 text-lg">{profile!.favorite_joke}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-sm text-neutral-500">The five-star shelf</h2>
        <ol className="flex flex-col gap-3">
          {best.map((j) => (
            <li key={j.id} className="rounded-xl border border-neutral-800 p-4">
              <p className="font-medium">{j.setup}</p>
              <p className="mt-1 text-neutral-300">{j.punchline}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
