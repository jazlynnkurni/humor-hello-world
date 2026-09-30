import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getUserAndProfile } from "@/lib/profile";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-7xl px-6 pt-40 md:px-16">
      <div className="head">
        <p className="eyebrow">Profile</p>
        <h1 className="t-h1">Your byline, your portrait.</h1>
        <p className="lede">{user.email}</p>
      </div>
      <div className="mt-16">
        <ProfileForm profile={profile ?? { id: user.id, email: user.email ?? null, first_name: null, last_name: null, avatar_url: null, favorite_joke: null }} />
      </div>
    </main>
  );
}
