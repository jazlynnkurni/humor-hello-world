import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (user) redirect(profileIsComplete(profile) ? "/members" : "/onboarding");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="t-h1">Sign in</h1>
      <p className="text-[color:var(--ink-60)]">Members generate punchlines, vote on them, and print their own jokes.</p>
      <GoogleButton />
      {error && <p className="t-sm text-oxblood">That sign-in didn&apos;t finish. Try once more.</p>}
    </main>
  );
}
