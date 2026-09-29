import { redirect } from "next/navigation";
import { VennLogin } from "@/components/riso/VennLogin";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (user) redirect(profileIsComplete(profile) ? "/members" : "/onboarding");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 md:px-16">
      <div className="max-w-[560px]">
        <p className="eyebrow">Sign in</p>
        <h1 className="t-h1 mt-3">You, and the jokes.</h1>
        <p className="t-lg mt-4 text-[color:var(--ink-60)]">
          Members can laugh at a joke and print their own. The green disc is you. Drag it into the other one.
        </p>
        {error && <p className="t-sm mt-4 text-oxblood">That sign-in didn&apos;t finish. Try once more.</p>}
      </div>
      <div className="mt-6">
        <VennLogin />
      </div>
    </main>
  );
}
