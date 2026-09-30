"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type NavItem = { href: string; label: string; quiet?: boolean } | { signout: true };

/**
 * Her nav pill: the mode icon at its head, then the links. A soft drop slides
 * under whatever the hand is on and eases out when it leaves. The nav gains a
 * paper ground once the page has scrolled under it.
 */
export function NavPill({ items }: { items: NavItem[] }) {
  const pill = useRef<HTMLSpanElement>(null);
  const drop = useRef<HTMLSpanElement>(null);
  const path = usePathname();

  useEffect(() => {
    const p = pill.current, d = drop.current;
    if (!p || !d) return;
    let seeded = false, cx = 0;
    const set = (x: number, w: number) => { d.style.transform = `translateX(${x}px)`; d.style.width = `${w}px`; };
    const go = (el: HTMLElement) => {
      const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
      const x = r.left - pr.left, w = r.width;
      if (!seeded) { d.style.transition = "none"; set(x + w / 2, 0); void d.offsetWidth; d.style.transition = ""; seeded = true; }
      cx = x + w / 2;
      d.classList.remove("out"); set(x, w); d.classList.add("on");
    };
    const leave = () => { d.classList.add("out"); set(cx, 0); d.classList.remove("on"); };
    const targets = Array.from(p.querySelectorAll<HTMLElement>("a, button"));
    const ons: [HTMLElement, () => void][] = [];
    for (const el of targets) {
      const f = () => go(el);
      el.addEventListener("pointerenter", f); el.addEventListener("focus", f); ons.push([el, f]);
    }
    p.addEventListener("pointerleave", leave);
    const fo = (e: FocusEvent) => { if (!p.contains(e.relatedTarget as Node)) leave(); };
    p.addEventListener("focusout", fo);

    /* the ground under the nav once headlines scroll up beneath it */
    const nav = p.closest(".nav");
    const onScroll = () => nav?.classList.toggle("grounded", scrollY > 48);
    onScroll(); addEventListener("scroll", onScroll, { passive: true });

    return () => {
      for (const [el, f] of ons) { el.removeEventListener("pointerenter", f); el.removeEventListener("focus", f); }
      p.removeEventListener("pointerleave", leave); p.removeEventListener("focusout", fo);
      removeEventListener("scroll", onScroll);
    };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.classList.add("theming");
    setTimeout(() => root.classList.remove("theming"), 560);
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch {}
    dispatchEvent(new CustomEvent("themechange", { detail: { theme: t } }));
  }

  return (
    <span className="links" ref={pill}>
      <span className="drop" ref={drop} aria-hidden />
      <button id="theme" type="button" aria-label="Switch colour mode" title="Colour mode" onClick={toggleTheme}>
        <svg className="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        <svg className="moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      </button>
      {items.map((it, i) =>
        "signout" in it ? (
          <form key={i} action="/auth/signout" method="post">
            <button type="submit" className="quiet">Sign out</button>
          </form>
        ) : (
          <Link key={it.href} href={it.href} className={it.quiet ? "quiet" : undefined} aria-current={path === it.href ? "page" : undefined}>
            {it.label}
          </Link>
        ),
      )}
    </span>
  );
}
