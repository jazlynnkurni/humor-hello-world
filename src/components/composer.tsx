"use client";

import { useState } from "react";
import type { Joke, Author } from "@/lib/jokes";
import { JokeRow } from "./joke-row";

/** Write a setup and a punchline and watch the line set itself beside you. */
export function Composer({ action, author, error }: { action: (fd: FormData) => void | Promise<void>; author: Author; error?: string }) {
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
  const words = ["", "a groan", "a smirk", "a laugh", "a real laugh", "a spit take"];

  return (
    <div className="grid gap-16 md:grid-cols-2">
      <form action={action} className="flex flex-col gap-8">
        <label className="field">
          <span>Setup</span>
          <textarea
            name="setup"
            value={setup}
            onChange={(e) => setSetup(e.target.value.slice(0, 240))}
            placeholder="Why did the joke cross Broadway?"
            required
            rows={2}
            className="input"
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
            rows={2}
            className="input"
          />
        </label>
        <fieldset className="field">
          <legend className="eyebrow">How good is it, honestly</legend>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setRating(k)}
                aria-label={`${k} of 5`}
                aria-pressed={rating === k}
                className={`eyebrow tnum flex h-11 w-11 items-center justify-center border-b transition-colors active:scale-[.96] ${k === rating ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
              >
                {k}
              </button>
            ))}
            <span className="t-sm ml-3 text-ink-2">{words[rating]}</span>
          </div>
          <input type="hidden" name="rating" value={rating} />
        </fieldset>
        {error === "empty" && <p className="t-sm text-plum">Both lines are required.</p>}
        {error && error !== "empty" && <p className="t-sm text-plum">{decodeURIComponent(error)}</p>}
        <button className="btn btn-ink self-start" disabled={!setup.trim() || !punchline.trim()}>
          Print it
        </button>
      </form>

      <div className="self-start">
        <p className="eyebrow mb-4">The line, as it will print</p>
        <ul className="rows">
          <JokeRow joke={preview} open canLaugh={false} preview index={1} />
        </ul>
      </div>
    </div>
  );
}
