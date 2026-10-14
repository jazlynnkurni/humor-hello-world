"use client";

import { useCallback } from "react";
import { RisoSheets, type SheetsHandle } from "./RisoSheets";

/* her arrangement, set by hand in /sheets-lab on 2026-10-13 and locked in */
const SHEETS = [
  { x: 0.052, y: 0.193, r: 0.115 }, { x: 0.843, y: 0.72, r: 0.12 }, { x: 0.066, y: 0.706, r: 0.072 },
  { x: 0.179, y: 0.827, r: 0.115 }, { x: 0.02, y: 0.5, r: 0.09 }, { x: 0.044, y: 0.883, r: 0.07 },
  { x: 0.823, y: 0.241, r: 0.078 }, { x: 0.941, y: 0.131, r: 0.097 }, { x: 0.929, y: 0.369, r: 0.085 },
  { x: 0.914, y: 0.551, r: 0.1 }, { x: 0.199, y: 0.288, r: 0.078 }, { x: 0.948, y: 0.902, r: 0.074 },
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
