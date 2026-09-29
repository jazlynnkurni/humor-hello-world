import Link from "next/link";
import { getUserAndProfile } from "@/lib/profile";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const name = profile?.first_name ?? user?.email?.split("@")[0];

  return (
    <nav className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4 text-sm">
      <div className="flex gap-5">
        <Link href="/" className="text-neutral-400 hover:text-white">Home</Link>
        <Link href="/jokes" className="text-neutral-400 hover:text-white">Jokes</Link>
        <Link href="/members" className="text-neutral-400 hover:text-white">Members</Link>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <Link href="/profile" className="flex items-center gap-2 text-neutral-300 hover:text-white">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : null}
            {name}
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-neutral-500 hover:text-white">Sign out</button>
          </form>
        </div>
      ) : (
        <Link href="/login" className="rounded-full border border-neutral-700 px-4 py-1.5 hover:bg-neutral-900">
          Sign in
        </Link>
      )}
    </nav>
  );
}
