"use client";

import { RisoSheets } from "./RisoSheets";

/* two clusters of her discs, one at each edge, the middle left clear for the words and the stamp */
/* kept out past the text column on the left and the stamp on the right */
const SHEETS = [
  { x: -0.06, y: 0.16, r: 0.12 }, { x: 0.05, y: 0.3, r: 0.085 }, { x: -0.04, y: 0.48, r: 0.125 },
  { x: 0.06, y: 0.64, r: 0.08 }, { x: -0.05, y: 0.8, r: 0.11 }, { x: 0.04, y: 0.94, r: 0.085 },
  { x: 1.05, y: 0.14, r: 0.115 }, { x: 0.95, y: 0.3, r: 0.08 }, { x: 1.04, y: 0.47, r: 0.125 },
  { x: 0.96, y: 0.65, r: 0.08 }, { x: 1.05, y: 0.8, r: 0.11 }, { x: 0.97, y: 0.95, r: 0.085 },
];
const SHEETS_NARROW = [
  { x: -0.08, y: 0.12, r: 0.16 }, { x: 1.08, y: 0.22, r: 0.15 }, { x: -0.06, y: 0.5, r: 0.14 },
  { x: 1.06, y: 0.62, r: 0.16 }, { x: -0.04, y: 0.88, r: 0.13 }, { x: 1.04, y: 0.96, r: 0.14 },
];

export function HeroSheets({ narrow }: { narrow?: boolean }) {
  return <RisoSheets sheets={narrow ? SHEETS_NARROW : SHEETS} opacity={0.88} grain={0.08} className="absolute inset-0 h-full w-full" />;
}
