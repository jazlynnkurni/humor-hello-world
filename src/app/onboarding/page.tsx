import { redirect } from "next/navigation";
import { getUserAndProfile, profileIsComplete } from "@/lib/profile";
import { saveNames } from "./actions";

export const metadata = { title: "Finish your profile" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (profileIsComplete(profile)) redirect("/members");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">One more thing</h1>
      <p className="mt-2 text-neutral-400">
        We need a name to put on your jokes. Signed in as {user.email}.
      </p>
      <form action={saveNames} className="mt-8 flex flex-col gap-4">
        <Field label="First name" name="first_name" defaultValue={profile?.first_name ?? ""} required />
        <Field label="Last name" name="last_name" defaultValue={profile?.last_name ?? ""} required />
        <Field label="Favorite Columbia joke (optional)" name="favorite_joke" defaultValue={profile?.favorite_joke ?? ""} />
        {error === "missing" && (
          <p className="text-sm text-red-400">Both names are required.</p>
        )}
        <button className="mt-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200">
          Continue
        </button>
      </form>
    </main>
  );
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-neutral-400">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-base outline-none focus:border-neutral-500"
      />
    </label>
  );
}
