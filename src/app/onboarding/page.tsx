import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Set up your profile" };

/**
 * Shown once, right after the first Google sign-in, while first or last name
 * is still empty in profiles. Google's photo and name are the starting point;
 * nothing is saved until they press Continue.
 */
export default async function OnboardingPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (profileIsComplete(profile)) redirect("/members");

  const start = {
    id: user.id,
    email: user.email,
    first_name: profile?.first_name ?? user.suggested.first_name,
    last_name: profile?.last_name ?? user.suggested.last_name,
    avatar_url: profile?.avatar_url ?? user.suggested.avatar_url,
    favorite_joke: profile?.favorite_joke ?? null,
    bio: profile?.bio ?? null,
    created_at: profile?.created_at ?? null,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 pt-32 md:px-0">
      <p className="eyebrow">One more thing</p>
      <h1 className="t-h1 mt-3">Set up your profile</h1>
      <p className="mt-3 text-[color:var(--ink-60)]">
        Signed in as {user.email}. This is how you&apos;ll appear on the jokes you write. Change anything.
      </p>
      <ProfileForm profile={start} mode="setup" />
    </main>
  );
}
