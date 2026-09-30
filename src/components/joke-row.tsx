"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Joke } from "@/lib/jokes";
import { toggleLaugh } from "@/app/actions";

/** A joke is a line in a list. The setup is the line; the punchline is under it, pressed out when asked. */
export function JokeRow({
  joke,
  index = 0,
  n,
  open: forcedOpen,
  canLaugh,
  highlight,
  preview,
}: {
  joke: Joke;
  index?: number;
  n?: number;
  open?: boolean;
  canLaugh: boolean;
  highlight?: boolean;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(forcedOpen));
  const [laughed, setLaughed] = useState(joke.laughed);
  const [count, setCount] = useState(joke.laughs);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (highlight) {
      ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      setOpen(true);
    }
  }, [highlight]);

  const isOpen = forcedOpen ?? open;
  const by = joke.author ? [joke.author.first_name, joke.author.last_name].filter(Boolean).join(" ") || "a member" : null;

  function laugh() {
    if (preview) return;
    const next = !laughed;
    setLaughed(next);
    setCount((c) => c + (next ? 1 : -1));
    start(() => toggleLaugh(joke.id, !next));
  }

  return (
    <li
      ref={ref}
      style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
      className="row enter grid gap-x-8 gap-y-4 py-8 md:grid-cols-[48px_1fr_auto]"
    >
      <span className="eyebrow tnum hidden pt-2 text-ink-3 md:block">{n !== undefined ? String(n).padStart(2, "0") : ""}</span>

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => forcedOpen === undefined && setOpen((o) => !o)}
          aria-expanded={isOpen}
          className="group block w-full text-left"
        >
          <p className="text-[22px] font-light leading-[1.35] text-ink md:text-[25px]">{joke.setup}</p>
          <div
            className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
          >
            <div className="overflow-hidden">
              <p
                className="pt-3 text-[20px] font-light leading-[1.45] text-ink-2 transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
                style={{ transform: isOpen ? "none" : "translateY(6px)" }}
              >
                {joke.punchline}
              </p>
            </div>
          </div>
          <span
            className="eyebrow mt-3 block text-ink-3 transition-[opacity,color] duration-300 group-hover:text-ink-2"
            style={{ opacity: isOpen ? 0 : 1, height: isOpen ? 0 : undefined, marginTop: isOpen ? 0 : undefined }}
          >
            Punchline
          </span>
        </button>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-2">
          <span className="eyebrow tnum text-ink-3" aria-label={`${joke.rating} of 5`}>
            {joke.rating} / 5
          </span>
          {by ? (
            <span>{by}</span>
          ) : joke.source_url ? (
            <a href={joke.source_url} target="_blank" rel="noreferrer" className="link font-light">
              from r/columbia
            </a>
          ) : (
            <span>from the record</span>
          )}
        </div>
      </div>

      <div className="flex items-start md:justify-end">
        {canLaugh ? (
          <button
            type="button"
            onClick={laugh}
            disabled={pending}
            aria-pressed={laughed}
            className={`eyebrow flex h-11 items-center gap-3 px-2 transition-colors ${laughed ? "text-ink" : "text-ink-3 hover:text-ink"}`}
          >
            <span
              className="inline-block font-[family-name:var(--font-head)] text-[20px] font-light normal-case tracking-normal transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
              style={{ transform: laughed ? "scale(1.15) rotate(-6deg)" : "none" }}
            >
              ha
            </span>
            <span className="tnum">{count}</span>
          </button>
        ) : (
          <Link href="/login" className="eyebrow flex h-11 items-center gap-3 px-2 text-ink-3 transition-colors hover:text-ink">
            <span className="inline-block font-[family-name:var(--font-head)] text-[20px] font-light normal-case tracking-normal">ha</span>
            <span className="tnum">{count}</span>
          </Link>
        )}
      </div>
    </li>
  );
}
