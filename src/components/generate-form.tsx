"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/** The member's half of the loop: take today's setup, or write your own, and ask for three. */
export function GenerateForm({ action, setup, left }: { action: (fd: FormData) => void | Promise<void>; setup: string; left: number }) {
  const [own, setOwn] = useState(false);
  const [text, setText] = useState("");
  const out = left <= 0;

  return (
    <form action={action} className="card flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{own ? "Your setup" : "Today's setup"}</p>
          {!own && <p className="mt-2 font-jak text-[20px] font-semibold leading-[1.3]">{setup}</p>}
        </div>
        <span className="t-sm tabular-nums text-[color:var(--ink-60)]">{out ? "No generations left today" : `${left} left today`}</span>
      </div>

      {own && (
        <label className="field">
          <span>A place, a class, a situation</span>
          <input name="setup" value={text} onChange={(e) => setText(e.target.value.slice(0, 140))} placeholder="The 116th Street gates at 3am" className="input" autoFocus required />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Submit disabled={out || (own && text.trim().length < 3)} />
        <button type="button" onClick={() => setOwn((o) => !o)} className="btn btn-ghost">
          {own ? "Use today's setup instead" : "Write my own setup"}
        </button>
      </div>
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ink" disabled={disabled || pending}>
      {pending ? "Writing three…" : "Write me three punchlines"}
    </button>
  );
}
