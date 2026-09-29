import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getUserAndProfile } from "@/lib/profile";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-neutral-400">{user.email}</p>
      <ProfileForm
        profile={
          profile ?? {
            id: user.id,
            email: user.email ?? null,
            first_name: null,
            last_name: null,
            avatar_url: null,
            favorite_joke: null,
          }
        }
      />
    </main>
  );
}
