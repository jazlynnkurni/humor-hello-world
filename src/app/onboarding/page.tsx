import { redirect } from "next/navigation";
import { BylineForm } from "@/components/byline-form";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";
import { saveNames } from "./actions";

export const metadata = { title: "Your byline" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (profileIsComplete(profile)) redirect("/members");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 md:px-16">
      <div className="max-w-[560px]">
        <p className="eyebrow">One more thing</p>
        <h1 className="t-h1 mt-3">Every print needs a byline.</h1>
        <p className="t-lg mt-4 text-[color:var(--ink-60)]">
          Signed in as {user.email}. Tell us what to print under your jokes.
        </p>
      </div>
      <div className="mt-12">
        <BylineForm
          action={saveNames}
          first={profile?.first_name ?? ""}
          last={profile?.last_name ?? ""}
          joke={profile?.favorite_joke ?? ""}
          error={error}
        />
      </div>
    </main>
  );
}
