"use client";

import { useState } from "react";
import type { Joke, Author } from "@/lib/jokes";
import { JokeCard } from "./joke-card";

/** Write a setup and a punchline and watch the print typeset itself beside you. */
export function Composer({
  action,
  author,
  error,
}: {
  action: (fd: FormData) => void | Promise<void>;
  author: Author;
  error?: string;
}) {
  const [setup, setSetup] = useState("");
  const [punchline, setPunchline] = useState("");
  const [rating, setRating] = useState(3);

  const preview: Joke = {
    id: -1,
    setup: setup.trim() || "Why did the joke cross Broadway?",
    punchline: punchline.trim() || "Type a punchline and find out.",
    rating,
    source_url: null,
    author_id: author.id,
    created_at: new Date().toISOString(),
    laughs: 0,
    laughed: false,
    author,
  };

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16">
      <form action={action} className="flex flex-col gap-5">
        <label className="field">
          <span>Setup</span>
          <textarea
            name="setup"
            value={setup}
            onChange={(e) => setSetup(e.target.value.slice(0, 240))}
            placeholder="Why did the joke cross Broadway?"
            required
            rows={3}
            className="input font-jak text-[18px] font-semibold"
          />
        </label>
        <label className="field">
          <span>Punchline</span>
          <textarea
            name="punchline"
            value={punchline}
            onChange={(e) => setPunchline(e.target.value.slice(0, 240))}
            placeholder="To get to the other Ivy."
            required
            rows={3}
            className="input"
          />
        </label>
        <fieldset className="field">
          <legend className="font-jak text-[13px] font-medium text-[color:var(--ink-60)]">How good is it, honestly</legend>
          <div className="mt-2 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} of 5`}
                aria-pressed={rating === n}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-[.96]"
              >
                <span
                  className="block h-3.5 w-3.5 rounded-full transition-[background-color,transform] duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
                  style={{ background: n <= rating ? "var(--ink)" : "var(--ink-12)", transform: n === rating ? "scale(1.3)" : "none" }}
                />
              </button>
            ))}
            <span className="t-sm ml-2 text-[color:var(--ink-60)]">{["", "a groan", "a smirk", "a laugh", "a real laugh", "a spit take"][rating]}</span>
          </div>
          <input type="hidden" name="rating" value={rating} />
        </fieldset>
        {error === "empty" && <p className="t-sm text-oxblood">Both lines are required.</p>}
        {error && error !== "empty" && <p className="t-sm text-oxblood">{decodeURIComponent(error)}</p>}
        <button className="btn btn-ink mt-2 self-start" disabled={!setup.trim() || !punchline.trim()}>
          Print it
        </button>
      </form>

      <div className="self-start">
        <p className="eyebrow mb-4">The print</p>
        <JokeCard joke={preview} open canLaugh={false} preview index={1} />
      </div>
    </div>
  );
}
