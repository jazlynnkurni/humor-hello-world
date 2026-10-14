import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getUserAndProfile } from "@/lib/profile";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const since = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-32 md:px-0">
      <h1 className="t-h1">Profile</h1>
      <p className="mt-3 text-[color:var(--ink-60)]">
        {user.email}
        {since ? `. Member since ${since}.` : ""}
      </p>
      <ProfileForm
        profile={
          profile ?? { id: user.id, email: user.email ?? null, first_name: null, last_name: null, avatar_url: null, favorite_joke: null, bio: null, created_at: null }
        }
      />

      <section className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--ink-12)] pt-8">
        <p className="t-sm text-[color:var(--ink-60)]">Signed in with Google as {user.email}.</p>
        <form action="/auth/signout" method="post">
          <button className="btn btn-paper">Sign out</button>
        </form>
      </section>
    </main>
  );
}
