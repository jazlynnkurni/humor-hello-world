import Link from "next/link";
import { getUserAndProfile } from "@/lib/profile";
import { DiscMark } from "./disc-mark";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const name = profile?.first_name ?? user?.email?.split("@")[0];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 pt-5 md:px-16">
      <Link
        href="/"
        className="pointer-events-auto flex h-10 items-center gap-3 font-jak text-[15px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-oxblood"
      >
        <DiscMark />
        Columbia Jokes
      </Link>

      <nav className="pill pointer-events-auto flex h-12 items-center gap-1 pl-2 pr-2 font-jak text-[14px] font-medium">
        <NavLink href="/jokes">Jokes</NavLink>
        {user && <NavLink href="/write">Write</NavLink>}
        {user && <NavLink href="/members">Desk</NavLink>}
        {user ? (
          <>
            <Link
              href="/profile"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-ink transition-colors hover:text-oxblood"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage text-[11px] font-semibold text-paper">
                  {(name?.[0] ?? "?").toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">{name}</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button className="btn btn-ghost h-10 min-h-0 text-[14px]">Sign out</button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn btn-ink ml-1 h-9 min-h-0 px-4 text-[14px]">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center rounded-full px-3 text-[color:var(--ink-60)] transition-colors hover:text-oxblood"
    >
      {children}
    </Link>
  );
}
