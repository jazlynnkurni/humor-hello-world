"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Joke } from "@/lib/jokes";
import { toggleLaugh } from "@/app/actions";
import { DiscMark } from "./disc-mark";

/* a byline's discs come from its id so the same author always prints the same pair */
const PAIRS: [string, string][] = [
  ["var(--sage)", "var(--mauve)"],
  ["var(--lilac)", "var(--sage)"],
  ["var(--stone)", "var(--mauve)"],
  ["var(--cream)", "var(--sage)"],
  ["var(--grey)", "var(--mauve)"],
];
function pairFor(key: string | number) {
  const s = String(key);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PAIRS[Math.abs(h) % PAIRS.length];
}

export function JokeCard({
  joke,
  index = 0,
  open: forcedOpen,
  canLaugh,
  highlight,
  preview,
}: {
  joke: Joke;
  index?: number;
  open?: boolean;
  canLaugh: boolean;
  highlight?: boolean;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(forcedOpen));
  const [laughed, setLaughed] = useState(joke.laughed);
  const [count, setCount] = useState(joke.laughs);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLElement>(null);
  const [a, b] = pairFor(joke.author_id ?? joke.id);

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  const isOpen = forcedOpen ?? open;
  const by = joke.author
    ? [joke.author.first_name, joke.author.last_name].filter(Boolean).join(" ") || "a member"
    : null;

  function laugh() {
    if (preview) return;
    const next = !laughed;
    setLaughed(next);
    setCount((c) => c + (next ? 1 : -1));
    start(() => toggleLaugh(joke.id, !next));
  }

  return (
    <article
      ref={ref}
      style={{ "--i": index } as React.CSSProperties}
      className={`card enter group relative flex flex-col gap-4 p-6 ${highlight ? "stamped" : ""}`}
    >
      <header className="flex items-center justify-between">
        <DiscMark a={a} b={b} size={16} />
        <span className="flex items-center gap-1" aria-label={`${joke.rating} of 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ background: i < joke.rating ? "var(--ink)" : "var(--ink-12)" }}
            />
          ))}
        </span>
      </header>

      <button
        type="button"
        onClick={() => forcedOpen === undefined && setOpen((o) => !o)}
        aria-expanded={isOpen}
        className="-m-2 flex flex-col items-start gap-3 rounded-[16px] p-2 text-left"
      >
        <p className="font-jak text-[20px] font-semibold leading-[1.3] tracking-[-0.01em]">{joke.setup}</p>
        <div
          className="grid w-full transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <p
              className="riso-ink text-[18px] leading-[1.4] transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{ transform: isOpen ? "none" : "translateY(8px)" }}
            >
              {joke.punchline}
            </p>
          </div>
        </div>
        {!isOpen && (
          <span className="font-jak text-[13px] font-medium text-[color:var(--ink-40)] transition-colors group-hover:text-oxblood">
            tap for the punchline
          </span>
        )}
      </button>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="t-sm flex min-w-0 items-center gap-2 text-[color:var(--ink-60)]">
          {by ? (
            <>
              {joke.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={joke.author.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : null}
              <span className="truncate">{by}</span>
            </>
          ) : joke.source_url ? (
            <a href={joke.source_url} target="_blank" rel="noreferrer" className="link truncate">
              from r/columbia ↗
            </a>
          ) : (
            <span>from the record</span>
          )}
        </span>

        {canLaugh ? (
          <button
            type="button"
            onClick={laugh}
            disabled={pending}
            aria-pressed={laughed}
            className="btn btn-paper h-9 min-h-0 gap-2 px-3 text-[14px]"
          >
            <span
              className="h-3 w-3 rounded-full transition-[transform,background-color] duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
              style={{ background: laughed ? "var(--oxblood)" : "var(--ink-12)", transform: laughed ? "scale(1.25)" : "none" }}
            />
            {laughed ? "ha" : "ha?"}
            <span className="tabular-nums text-[color:var(--ink-60)]">{count}</span>
          </button>
        ) : (
          <Link href="/login" className="btn btn-paper h-9 min-h-0 gap-2 px-3 text-[14px]">
            <span className="h-3 w-3 rounded-full" style={{ background: "var(--ink-12)" }} />
            ha?
            <span className="tabular-nums text-[color:var(--ink-60)]">{count}</span>
          </Link>
        )}
      </footer>
    </article>
  );
}
