import { redirect } from "next/navigation";
import { VennLogin } from "@/components/riso/VennLogin";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  /* only paths on this site, never another origin */
  const back = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const { user, profile } = await getUserAndProfile();
  if (user) redirect(!profileIsComplete(profile) ? "/onboarding" : back ?? "/members");

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <VennLogin />
      <div className="pointer-events-none relative mx-auto max-w-md px-6 pt-32 text-center">
        <h1 className="t-h1">Sign in</h1>
        <p className="mt-3 text-[color:var(--ink-60)]">
          Members get the jokes that didn&apos;t make the public list. The green disc is you. Drag it into the other one.
        </p>
        {back && !error && (
          <p className="t-sm mt-3 text-oxblood">Sign in to lol. You&apos;ll land back where you were.</p>
        )}
        {error === "domain" ? (
          <p className="t-sm mt-3 text-oxblood">That email isn&apos;t on the list. Columbia Laughs is for Columbia and Barnard addresses right now.</p>
        ) : error ? (
          <p className="t-sm mt-3 text-oxblood">That sign-in didn&apos;t finish. Try once more.</p>
        ) : null}
      </div>
    </main>
  );
}
