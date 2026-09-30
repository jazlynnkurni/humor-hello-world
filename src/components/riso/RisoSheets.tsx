"use client";

import { useEffect, useRef } from "react";

/**
 * The riso discs from jazlynnwashere.com, mounted from /sheets-gl.js (her
 * WebGL piece, copied verbatim plus a destroy()). Style 1 is the riso plate:
 * matte pigment on paper, overlaps going darker the way stacked ink does.
 */
export type Sheet = { x: number; y: number; r: number };
export type Disc = { x: number; y: number; r: number; ink: number; emph: number };
export type SheetsHandle = {
  discs: Disc[];
  draw: () => void;
  wake: () => void;
  toCss: (x: number, y: number) => [number, number];
  cssR: (r: number) => number;
  destroy: () => void;
  setStyle: (n: number) => void;
  P: { opacityLight: number; grainLight: number };
};

/* LOCKED on her site 2026-09-23: two creams, two greys, a dusky mauve, a grey green, a lilac grey, a sage. */
export const SWATCH = ["#dfddc8", "#c7c7c7", "#827a85", "#9ba69c", "#c4c1c8", "#dfddc8", "#c2beb3", "#dfdac8"];
export const PAPER = "#FAF9F7";
export const INK = "#1C1A17";

export function RisoSheets({
  sheets,
  swatch = SWATCH,
  style = 1,
  opacity = 1,
  grain = 0.22,
  bleed = 0,
  clear,
  className,
  onMount,
}: {
  sheets: Sheet[];
  swatch?: string[];
  style?: number;
  /** ink density on paper; 1 is her hero, lower prints lighter */
  opacity?: number;
  /** the paper's scan grain; lower when the canvas has a visible edge */
  grain?: number;
  bleed?: number;
  clear?: () => number;
  className?: string;
  onMount?: (h: SheetsHandle) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mountRef = useRef(onMount);
  mountRef.current = onMount;

  useEffect(() => {
    let alive = true;
    let handle: SheetsHandle | null = null;
    /* an absolute URL, not a module path: TypeScript would try to resolve a file, so it is a variable */
    const src = "/sheets-gl.js";
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ src)
      .then((m: { mountSheets: (cv: HTMLCanvasElement, s: Sheet[], sw: string[], o: object) => SheetsHandle | null }) => {
        if (!alive || !ref.current) return;
        handle = m.mountSheets(ref.current, sheets, swatch, { paper: PAPER, ground: INK, bleed, clear });
        if (!handle) return;
        handle.P.opacityLight = opacity;
        handle.P.grainLight = grain;
        (handle.P as { grainDark?: number }).grainDark = grain;
        handle.setStyle(style);
        mountRef.current?.(handle);
      })
      .catch(() => {});
    return () => {
      alive = false;
      handle?.destroy();
    };
    // The composition is fixed for the life of the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
