import Link from "next/link";
import { getUserAndProfile } from "@/lib/profile";
import { NavPill, type NavItem } from "./nav-pill";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();

  const items: NavItem[] = [
    { href: "/", label: "Home", smHide: true },
    { href: "/jokes", label: "Jokes" },
    { href: "/write", label: "Write" },
    ...(user ? ([{ href: "/profile", label: "Profile" }] as NavItem[]) : [{ href: "/login", label: "Sign in" }]),
    /* the admin area is its own app; only superadmins see the door */
    ...(profile?.is_superadmin ? ([{ href: "https://humor-admin.vercel.app", label: "Admin", external: true }] as NavItem[]) : []),
  ];

  return (
    <nav className="nav">
      <div className="in mx-auto max-w-7xl px-6 md:px-16">
        <Link href="/" className="mark">
          <span className="word">Columbia Jokes</span>
        </Link>
        <NavPill items={items} />
      </div>
    </nav>
  );
}
