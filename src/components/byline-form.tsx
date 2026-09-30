"use client";

import { useEffect, useState } from "react";

/** Onboarding fields with a live byline: the line shows what will print under their jokes. */
export function BylineForm({
  action,
  first = "",
  last = "",
  joke = "",
  error,
}: {
  action: (fd: FormData) => void | Promise<void>;
  first?: string;
  last?: string;
  joke?: string;
  error?: string;
}) {
  const [f, setF] = useState(first);
  const [l, setL] = useState(last);
  const [j, setJ] = useState(joke);
  const [carried, setCarried] = useState<{ setup: string; punchline: string } | null>(null);
  useEffect(() => {
    /* the punchline typed at sign-in comes with them */
    try {
      const raw = localStorage.getItem("pending_joke");
      if (raw && !joke) {
        const p = JSON.parse(raw);
        setCarried(p);
        setJ(`${p.setup} ${p.punchline}`);
        localStorage.removeItem("pending_joke");
      }
    } catch {}
  }, [joke]);
  const name = [f.trim(), l.trim()].filter(Boolean).join(" ");

  return (
    <div className="grid gap-16 md:grid-cols-2">
      <form action={action} className="flex flex-col gap-8">
        <label className="field">
          <span>First name</span>
          <input name="first_name" value={f} onChange={(e) => setF(e.target.value)} required autoFocus className="input" />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="last_name" value={l} onChange={(e) => setL(e.target.value)} required className="input" />
        </label>
        <label className="field">
          <span>Favorite Columbia joke, optional</span>
          <textarea name="favorite_joke" value={j} onChange={(e) => setJ(e.target.value)} className="input" rows={2} />
          {carried && <span className="t-sm normal-case tracking-normal text-ink-3" style={{ fontFamily: "var(--font-body)", fontWeight: 300, letterSpacing: 0, textTransform: "none" }}>Carried over from your sign-in. Edit it or clear it.</span>}
        </label>
        {error === "missing" && <p className="t-sm text-plum">Both names are required.</p>}
        <button className="btn btn-ink self-start">Print my byline</button>
      </form>

      <div className="enter self-start border-t border-[color:var(--hair)] pt-8" style={{ "--i": 2 } as React.CSSProperties}>
        <p className="text-[25px] font-light leading-[1.35]">Why did the joke want a byline?</p>
        <p className="pt-3 text-[20px] font-light text-ink-2">So someone would finally take credit for it.</p>
        <p className="eyebrow mt-6 transition-opacity duration-300" style={{ opacity: name ? 1 : 0.45 }}>
          {name || "your name here"}
        </p>
      </div>
    </div>
  );
}
