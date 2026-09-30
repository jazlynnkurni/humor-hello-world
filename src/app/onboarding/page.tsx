import { redirect } from "next/navigation";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";
import { saveNames } from "./actions";

export const metadata = { title: "Finish your profile" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (profileIsComplete(profile)) redirect("/members");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 pt-32">
      <h1 className="t-h2">One more thing</h1>
      <p className="mt-2 text-[color:var(--ink-60)]">We need a name to put on your jokes. Signed in as {user.email}.</p>
      <form action={saveNames} className="mt-8 flex flex-col gap-4">
        <label className="field">
          <span>First name</span>
          <input name="first_name" defaultValue={profile?.first_name ?? ""} required autoFocus className="input" />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="last_name" defaultValue={profile?.last_name ?? ""} required className="input" />
        </label>
        <label className="field">
          <span>Favorite Columbia joke (optional)</span>
          <input name="favorite_joke" defaultValue={profile?.favorite_joke ?? ""} className="input" />
        </label>
        {error === "missing" && <p className="t-sm text-oxblood">Both names are required.</p>}
        <button className="btn btn-ink mt-2 self-start">Continue</button>
      </form>
    </main>
  );
}
