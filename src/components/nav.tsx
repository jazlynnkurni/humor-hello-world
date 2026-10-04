import Link from "next/link";
import { getUserAndProfile } from "@/lib/profile";
import { DiscMark } from "./disc-mark";
import { NavPill, type NavItem } from "./nav-pill";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const name = profile?.first_name ?? user?.email?.split("@")[0] ?? "";

  const items: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/jokes", label: "Jokes" },
    { href: "/rate", label: "Rate" },
    { href: "/members", label: "Members" },
    ...(user ? ([{ href: "/write", label: "Write" }, { href: "/profile", label: name }, { signout: true }] as NavItem[]) : [{ href: "/login", label: "Sign in" }]),
  ];

  return (
    <nav className="nav">
      <div className="in mx-auto max-w-7xl px-6 md:px-16">
        <Link href="/" className="mark">
          <DiscMark size={14} />
          <span className="word">Columbia Jokes</span>
        </Link>
        <NavPill items={items} />
      </div>
    </nav>
  );
}
