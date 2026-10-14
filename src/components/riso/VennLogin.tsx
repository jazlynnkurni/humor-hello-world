"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RisoSheets, type SheetsHandle } from "./RisoSheets";

/**
 * Two discs. You are the sage one; the jokes are the plum one. Drag yours
 * into the other and the lens where they overlap becomes the sign-in button.
 * The overlap IS the button: how much they cross sets how present it is.
 */
const SHEETS = [
  { x: 0.3, y: 0.58, r: 0.17 },
  { x: 0.7, y: 0.58, r: 0.17 },
];
/* r is a share of the width, so a phone needs a bigger one to fill the same hand */
const SHEETS_NARROW = [
  { x: 0.26, y: 0.62, r: 0.24 },
  { x: 0.74, y: 0.62, r: 0.24 },
];
const SWATCH = ["#9ba69c", "#827a85"]; // sage, mauve
const THRESHOLD = 0.34;

function lens(a: { x: number; y: number; r: number }, b: { x: number; y: number; r: number }) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const rs = Math.min(a.r, b.r);
  if (d >= a.r + b.r) return { ratio: 0, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  if (d <= Math.abs(a.r - b.r)) return { ratio: 1, cx: a.r < b.r ? a.x : b.x, cy: a.r < b.r ? a.y : b.y };
  const r1 = a.r, r2 = b.r;
  const a1 = Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const a2 = Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  const area = r1 * r1 * (a1 - Math.sin(2 * a1) / 2) + r2 * r2 * (a2 - Math.sin(2 * a2) / 2);
  const ratio = area / (Math.PI * rs * rs);
  /* the lens sits on the line between centres, between the two near edges */
  const t = ((r1 - (r1 + r2 - d) / 2) / d);
  return { ratio, cx: a.x + (b.x - a.x) * t, cy: a.y + (b.y - a.y) * t };
}

export function VennLogin() {
  const handle = useRef<SheetsHandle | null>(null);
  const [ratio, setRatio] = useState(0);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);
  const [narrow, setNarrow] = useState<boolean | null>(null);
  useEffect(() => setNarrow(window.innerWidth < 640), []);

  const signIn = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let raf = 0;
    let start = [0, 0];
    const tick = () => {
      const h = handle.current;
      if (h && h.discs.length >= 2) {
        const [a, b] = [h.discs.find((d) => d.ink === 0)!, h.discs.find((d) => d.ink === 1)!];
        const L = lens(a, b);
        setRatio(L.ratio);
        setPos(h.toCss(L.cx, L.cy));
        if (!start[0] && !start[1]) start = [a.x, a.y];
        else if (!moved && Math.hypot(a.x - start[0], a.y - start[1]) > 0.02) setMoved(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moved]);

  /* touch, keyboard, or no patience: slide the discs together for them */
  function meet() {
    const h = handle.current;
    if (!h) return;
    const a = h.discs.find((d) => d.ink === 0) as (typeof h.discs)[number] & { tx: number; ty: number };
    const b = h.discs.find((d) => d.ink === 1)!;
    a.tx = b.x - b.r * 0.9;
    a.ty = b.y;
    h.wake();
  }

  const on = ratio >= THRESHOLD;
  const presence = Math.min(1, Math.max(0, (ratio - 0.08) / (THRESHOLD - 0.08)));

  return (
    /* the canvas is the whole page behind the heading, so it has no edge to show */
    <div className="absolute inset-0">
      {narrow !== null && (
        <RisoSheets
          sheets={narrow ? SHEETS_NARROW : SHEETS}
          swatch={SWATCH}
          grain={0.1}
          onMount={(h) => (handle.current = h)}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {/* the lens button, pinned to the overlap */}
      {pos && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-300 ease-[cubic-bezier(.2,.7,.2,1)]"
          style={{
            left: pos[0],
            top: pos[1],
            opacity: presence,
            transform: `translate(-50%, -50%) scale(${0.85 + presence * 0.15})`,
          }}
        >
          <button
            type="button"
            onClick={signIn}
            disabled={!on || busy}
            tabIndex={on ? 0 : -1}
            className={`btn btn-ink h-12 gap-3 px-6 shadow-[var(--shadow-float)] ${on ? "pointer-events-auto" : ""}`}
          >
            <GoogleG />
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>
        </div>
      )}

      {/* the instruction, which steps aside once followed */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-6 text-center">
        <p
          className="font-jak text-[14px] font-medium text-[color:var(--ink-60)] transition-opacity duration-500"
          style={{ opacity: on ? 0 : 1 }}
        >
          {moved ? "Closer." : "Drag the green disc into the plum one."}
        </p>
        <div className="pointer-events-auto flex items-center gap-4">
          <button type="button" onClick={meet} className="link t-sm">
            Bring them together for me
          </button>
          <span className="text-[color:var(--ink-12)]">·</span>
          <button type="button" onClick={signIn} className="link t-sm">
            Skip the game
          </button>
        </div>
        {error && <p className="t-sm text-oxblood">{error}</p>}
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
