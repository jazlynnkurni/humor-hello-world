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
      className="btn btn-ghost h-9 min-h-0 text-[14px]"
    >
      {pending ? "Pulling…" : "Pull it"}
    </button>
  );
}
