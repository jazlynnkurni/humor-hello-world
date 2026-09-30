"use client";

import { useTransition } from "react";
import { deleteJoke } from "@/app/actions";

export function DeleteButton({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Pull this print? It disappears for everyone.")) start(() => deleteJoke(id));
      }}
      className="eyebrow flex h-11 items-center text-ink-3 transition-colors hover:text-ink"
    >
      {pending ? "Pulling…" : "Pull it"}
    </button>
  );
}
