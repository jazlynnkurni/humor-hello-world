"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The password is a punchline. A setup is printed on the paper, you type
 * any punchline at all on the ruled line, and when you commit it the sheet
 * stamps it and prints the sign-in underneath as the actual punchline.
 * There is no wrong answer. Whatever you typed comes with you to onboarding.
 */
const SETUPS = [
  "Why did the first-year cross Broadway?",
  "How many Columbia students does it take to change a light bulb?",
  "What did the swim test say to the SEAS student?",
  "Why is Butler open twenty-four hours?",
  "A Barnard student and a Columbia student walk into Ferris.",
  "Why did Lit Hum get cancelled?",
];

export function PunchlineLogin() {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [told, setTold] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const setup = useMemo(() => SETUPS[i % SETUPS.length], [i]);

  useEffect(() => {
    /* a different setup each visit, chosen after mount so the server and the client agree */
    setI(Math.floor(Math.random() * SETUPS.length));
  }, []);

  const ready = text.trim().length >= 2;

  function tell(e?: React.FormEvent) {
    e?.preventDefault();
    if (!ready) return;
    setTold(true);
    try {
      localStorage.setItem("pending_joke", JSON.stringify({ setup, punchline: text.trim() }));
    } catch {}
  }

  async function signIn() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    // Redirect URI is exactly /auth/callback, no extra query params.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  function another() {
    setI((k) => k + 1);
    setText("");
    setTold(false);
    input.current?.focus();
  }

  return (
    <div className="max-w-[720px]">
      {/* the setup, printed */}
      <p className="text-[clamp(28px,3.6vw,40px)] font-light leading-[1.25] text-ink">{setup}</p>

      {/* the ruled line */}
      <form onSubmit={tell} className="mt-10">
        <label className="field">
          <span>Your punchline</span>
          <div className="relative">
            <input
              ref={input}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, 140));
                if (told) setTold(false);
              }}
              placeholder="Anything at all."
              autoComplete="off"
              autoFocus
              className="ruled"
              aria-describedby="pl-hint"
            />
            {told && (
              <span className="stamp stamp-in absolute -top-4 right-0" aria-hidden>
                Approved
              </span>
            )}
          </div>
        </label>
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
          <button type="submit" className="btn btn-ink" disabled={!ready || told}>
            Tell it
          </button>
          <p id="pl-hint" className="t-sm text-ink-2 transition-opacity duration-300" style={{ opacity: told ? 0 : 1 }}>
            {ready ? "Press enter." : "Type a punchline to unlock the sign-in."}
          </p>
        </div>
      </form>

      {/* the real punchline, printed once you have told yours */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-600 ease-[cubic-bezier(.2,.7,.2,1)]"
        style={{ gridTemplateRows: told ? "1fr" : "0fr", opacity: told ? 1 : 0 }}
        aria-hidden={!told}
      >
        <div className="overflow-hidden">
          <div className="mt-16 border-t border-[color:var(--hair)] pt-8" style={{ transform: told ? "none" : "translateY(8px)", transition: "transform 600ms cubic-bezier(.2,.7,.2,1)" }}>
            <p className="eyebrow">The actual punchline</p>
            <p className="mt-4 text-[25px] font-light leading-[1.35] text-ink">And that is when Google asked for your email.</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <button type="button" onClick={signIn} disabled={!told || busy} tabIndex={told ? 0 : -1} className="btn btn-ink gap-3">
                <GoogleG />
                {busy ? "Opening Google…" : "Continue with Google"}
              </button>
              <button type="button" onClick={another} tabIndex={told ? 0 : -1} className="link">
                Different setup
              </button>
            </div>
            <p className="t-sm mt-6 text-ink-2">Your punchline comes with you. It becomes your first line once you have a byline.</p>
            {error && <p className="t-sm mt-3 text-plum">{error}</p>}
          </div>
        </div>
      </div>

      {!told && (
        <p className="mt-16 t-sm text-ink-3">
          In a hurry?{" "}
          <button type="button" onClick={signIn} className="link">
            Skip the joke
          </button>
        </p>
      )}
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="currentColor" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" opacity=".9" />
      <path fill="currentColor" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" opacity=".7" />
      <path fill="currentColor" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" opacity=".55" />
      <path fill="currentColor" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" opacity=".8" />
    </svg>
  );
}
