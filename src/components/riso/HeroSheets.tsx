"use client";

import { RisoSheets } from "./RisoSheets";

/* her twelve from the live hero, fitted right of the headline */
const SHEETS = [
  { x: 0.63, y: 0.13, r: 0.13 }, { x: 0.8, y: 0.22, r: 0.12 }, { x: 0.95, y: 0.14, r: 0.105 },
  { x: 0.72, y: 0.36, r: 0.125 }, { x: 0.89, y: 0.4, r: 0.115 }, { x: 1.02, y: 0.3, r: 0.1 },
  { x: 0.66, y: 0.58, r: 0.135 }, { x: 0.83, y: 0.62, r: 0.115 }, { x: 0.98, y: 0.54, r: 0.11 },
  { x: 0.76, y: 0.82, r: 0.125 }, { x: 0.92, y: 0.76, r: 0.105 }, { x: 1.04, y: 0.86, r: 0.095 },
];
/* on a phone the discs sit above the words instead of beside them */
const SHEETS_NARROW = [
  { x: 0.18, y: 0.1, r: 0.2 }, { x: 0.5, y: 0.07, r: 0.22 }, { x: 0.82, y: 0.11, r: 0.19 },
  { x: 0.3, y: 0.24, r: 0.21 }, { x: 0.66, y: 0.23, r: 0.2 }, { x: 0.95, y: 0.27, r: 0.17 },
];

export function HeroSheets({ narrow }: { narrow?: boolean }) {
  return (
    <RisoSheets
      sheets={narrow ? SHEETS_NARROW : SHEETS}
      clear={narrow ? undefined : () => 0.5}
      opacity={0.88}
      grain={0.08}
      className="absolute inset-0 h-full w-full"
    />
  );
}
