"use client";

import { useState } from "react";
import { DiscMark } from "./disc-mark";

/** Onboarding fields with a live byline print: the card shows what their name will look like under a joke. */
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
  const name = [f.trim(), l.trim()].filter(Boolean).join(" ");

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:gap-12">
      <form action={action} className="flex flex-col gap-5">
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
          <textarea name="favorite_joke" defaultValue={joke} className="input" rows={3} />
        </label>
        {error === "missing" && <p className="t-sm text-oxblood">Both names are required.</p>}
        <button className="btn btn-ink mt-2 self-start">Print my byline</button>
      </form>

      <div className="card enter flex flex-col gap-4 self-start p-6" style={{ "--i": 2 } as React.CSSProperties}>
        <DiscMark size={16} />
        <p className="font-jak text-[20px] font-semibold leading-[1.3]">Why did the joke want a byline?</p>
        <p className="riso-ink text-[18px]">So someone would finally take credit for it.</p>
        <p className="t-sm mt-2 flex items-center gap-2 text-[color:var(--ink-60)]">
          <span
            className="inline-block h-2 w-2 rounded-full transition-colors duration-300"
            style={{ background: name ? "var(--oxblood)" : "var(--ink-12)" }}
          />
          <span className="transition-opacity duration-300" style={{ opacity: name ? 1 : 0.5 }}>
            {name || "your name here"}
          </span>
        </p>
      </div>
    </div>
  );
}
