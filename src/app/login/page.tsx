import { redirect } from "next/navigation";
import { PunchlineLogin } from "@/components/punchline-login";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (user) redirect(profileIsComplete(profile) ? "/members" : "/onboarding");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-6 pt-40 md:px-16">
      <div className="head">
        <p className="eyebrow">Sign in</p>
        <h1 className="t-h1">The password is a punchline.</h1>
        <p className="lede">Finish the setup below with anything at all. Members say ha to a joke and print their own.</p>
        {error && <p className="t-sm mt-4 text-plum">That sign-in didn&apos;t finish. Try once more.</p>}
      </div>
      <div className="mt-16">
        <PunchlineLogin />
      </div>
    </main>
  );
}
