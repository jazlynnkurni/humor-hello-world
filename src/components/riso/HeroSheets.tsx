"use client";

import { useCallback } from "react";
import { RisoSheets, type SheetsHandle } from "./RisoSheets";

/* her arrangement, read off her screen on 2026-10-13: a stack up the left edge with
   one big sheet behind the title, and a loose column down the right around the stamp */
const SHEETS = [
  { x: 0.035, y: 0.19, r: 0.115 }, { x: 0.16, y: 0.35, r: 0.12 }, { x: 0.11, y: 0.64, r: 0.072 },
  { x: 0.075, y: 0.83, r: 0.115 }, { x: 0.02, y: 0.5, r: 0.09 }, { x: 0.13, y: 0.97, r: 0.07 },
  { x: 0.78, y: 0.23, r: 0.078 }, { x: 0.92, y: 0.15, r: 0.097 }, { x: 0.94, y: 0.39, r: 0.085 },
  { x: 0.795, y: 0.81, r: 0.1 }, { x: 0.94, y: 0.72, r: 0.078 }, { x: 0.95, y: 0.94, r: 0.074 },
];
const SHEETS_NARROW = [
  { x: -0.08, y: 0.12, r: 0.16 }, { x: 1.08, y: 0.22, r: 0.15 }, { x: -0.06, y: 0.5, r: 0.14 },
  { x: 1.06, y: 0.62, r: 0.16 }, { x: -0.04, y: 0.88, r: 0.13 }, { x: 1.04, y: 0.96, r: 0.14 },
];
const KEY = (narrow: boolean) => (narrow ? "home-sheets-narrow" : "home-sheets");

export function HeroSheets({ narrow }: { narrow?: boolean }) {
  /* a drag is kept: the sheets come back where they were left */
  const onMount = useCallback(
    (h: SheetsHandle) => {
      const key = KEY(Boolean(narrow));
      try {
        const raw = localStorage.getItem(key);
        if (raw) h.setLayout(JSON.parse(raw));
      } catch {}
      const save = () => {
        try {
          const l = h.layout();
          const moved: Record<number, { x: number; y: number }> = {};
          for (const k in l) if (l[k].moved) moved[k] = { x: l[k].x, y: l[k].y };
          if (Object.keys(moved).length) localStorage.setItem(key, JSON.stringify(moved));
        } catch {}
      };
      addEventListener("pointerup", save);
      addEventListener("pointercancel", save);
    },
    [narrow],
  );
  return <RisoSheets sheets={narrow ? SHEETS_NARROW : SHEETS} opacity={0.88} grain={0.08} onMount={onMount} className="absolute inset-0 h-full w-full" />;
}
