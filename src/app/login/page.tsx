import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const { user, profile } = await getUserAndProfile();
  if (user) redirect(profileIsComplete(profile) ? "/members" : "/onboarding");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-neutral-400">
        Members get the jokes that didn&apos;t make the public list.
      </p>
      <GoogleButton />
    </main>
  );
}
