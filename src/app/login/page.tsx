import { redirect } from "next/navigation";
import { VennLogin } from "@/components/riso/VennLogin";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await getUserAndProfile();
  if (user) redirect(profileIsComplete(profile) ? "/members" : "/onboarding");
  const { error } = await searchParams;

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <VennLogin />
      <div className="pointer-events-none relative mx-auto max-w-md px-6 pt-32 text-center">
        <h1 className="t-h1">Sign in</h1>
        <p className="mt-3 text-[color:var(--ink-60)]">
          Members get the jokes that didn&apos;t make the public list. The green disc is you. Drag it into the other one.
        </p>
        {error && <p className="t-sm mt-3 text-oxblood">That sign-in didn&apos;t finish. Try once more.</p>}
      </div>
    </main>
  );
}
