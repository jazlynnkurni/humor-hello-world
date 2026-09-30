import Link from "next/link";
import { getUserAndProfile } from "@/lib/profile";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const name = profile?.first_name ?? user?.email?.split("@")[0];

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-16">
      <Link href="/" className="flex h-11 items-center font-[family-name:var(--font-head)] text-[14px] font-light tracking-[0.02em] text-ink">
        Columbia Jokes
      </Link>
      <nav className="flex items-center gap-1 sm:gap-4">
        <NavLink href="/jokes">Jokes</NavLink>
        {user && <NavLink href="/write">Write</NavLink>}
        {user && <NavLink href="/members">Desk</NavLink>}
        {user ? (
          <>
            <NavLink href="/profile">{name}</NavLink>
            <form action="/auth/signout" method="post">
              <button className="eyebrow flex h-11 items-center px-2 text-ink-3 transition-colors hover:text-ink">Sign out</button>
            </form>
          </>
        ) : (
          <NavLink href="/login" strong>
            Sign in
          </NavLink>
        )}
      </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children, strong }: { href: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <Link
      href={href}
      className={`eyebrow flex h-11 items-center px-2 transition-colors hover:text-ink ${strong ? "text-ink" : ""}`}
    >
      {children}
    </Link>
  );
}
