"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { RisoSheets, type SheetsHandle } from "@/components/riso/RisoSheets";
import { Stamp } from "@/components/stamp/Stamp";

/**
 * The lab. The real home, with the real sheets, plus a panel: drag any sheet,
 * scroll on it to resize, press Copy, paste the result into chat. The copied
 * block is the SHEETS array HeroSheets.tsx wants, in unit hero coordinates.
 */
const START = [
  { x: 0.052, y: 0.193, r: 0.115 }, { x: 0.843, y: 0.72, r: 0.12 }, { x: 0.066, y: 0.706, r: 0.072 },
  { x: 0.179, y: 0.827, r: 0.115 }, { x: 0.02, y: 0.5, r: 0.09 }, { x: 0.044, y: 0.883, r: 0.07 },
  { x: 0.823, y: 0.241, r: 0.078 }, { x: 0.941, y: 0.131, r: 0.097 }, { x: 0.929, y: 0.369, r: 0.085 },
  { x: 0.914, y: 0.551, r: 0.1 }, { x: 0.199, y: 0.288, r: 0.078 }, { x: 0.948, y: 0.902, r: 0.074 },
];

export function SheetsLab() {
  const h = useRef<SheetsHandle | null>(null);
  const [out, setOut] = useState("");
  const [copied, setCopied] = useState(false);

  const read = useCallback(() => {
    const H = h.current;
    if (!H) return "";
    const l = H.layout();
    const rows = H.discs
      .map((d) => ({ id: (d as unknown as { id: number }).id, r: (d as unknown as { ur: number }).ur }))
      .sort((a, b) => a.id - b.id)
      .map(({ id, r }) => `  { x: ${l[id].x.toFixed(3)}, y: ${l[id].y.toFixed(3)}, r: ${r.toFixed(3)} },`);
    return `const SHEETS = [\n${rows.join("\n")}\n];`;
  }, []);

  const onMount = useCallback((H: SheetsHandle) => {
    h.current = H;
    /* scroll over a sheet to resize it */
    const cv = document.querySelector<HTMLCanvasElement>("canvas[data-lab]");
    cv?.addEventListener(
      "wheel",
      (e) => {
        const r = cv.getBoundingClientRect();
        const [x, y] = [e.clientX - r.left, e.clientY - r.top];
        /* find the topmost sheet under the pointer, in css px */
        for (let i = H.discs.length - 1; i >= 0; i--) {
          const d = H.discs[i];
          const [cx, cy] = H.toCss(d.x, d.y);
          if (Math.hypot(x - cx, y - cy) <= H.cssR(d.r)) {
            e.preventDefault();
            const dd = d as unknown as { ur: number };
            dd.ur = Math.max(0.03, Math.min(0.3, dd.ur * (e.deltaY > 0 ? 0.96 : 1.04)));
            H.setLayout({});
            setOut(read());
            return;
          }
        }
      },
      { passive: false },
    );
    addEventListener("pointerup", () => setOut(read()));
    setOut(read());
  }, [read]);

  async function copy() {
    const text = read();
    setOut(text);
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <RisoSheets sheets={START} opacity={0.88} grain={0.08} onMount={onMount} className="absolute inset-0 h-full w-full" />
      </div>

      {/* the real home, on top, so the sheets are placed against what is actually there */}
      <div className="pointer-events-none relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-24 md:px-16">
        <div className="grid w-full items-center gap-12 md:grid-cols-[1fr_auto] md:gap-16">
          <div className="flex max-w-[560px] flex-col items-start gap-6">
            <h1 className="t-display">Columbia Jokes</h1>
            <p className="t-lg text-[color:var(--ink-60)]">A new setup every day. Members ask the model for punchlines, everyone votes, the best one wins the day.</p>
            <div className="flex flex-wrap gap-3">
              <span className="btn btn-ink">Rate today&apos;s punchlines →</span>
              <span className="btn btn-paper">See the jokes</span>
              <span className="btn btn-paper">Sign in</span>
            </div>
          </div>
          <div className="w-full max-w-[280px] justify-self-start md:w-[320px] md:max-w-none md:justify-self-end">
            <Stamp className="block aspect-[1/1.2] w-full" />
          </div>
        </div>
      </div>

      {/* the panel */}
      <aside className="card fixed bottom-6 right-6 z-50 flex w-[360px] max-w-[calc(100vw-48px)] flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <p className="font-jak text-[13px] font-semibold">Sheets lab</p>
          <Link href="/" className="t-sm text-[color:var(--ink-60)] hover:text-oxblood">home</Link>
        </div>
        <p className="t-sm text-[color:var(--ink-60)]">Drag a sheet to move it. Scroll on a sheet to resize it. The window you do this in is the window it is tuned for.</p>
        <textarea readOnly value={out} className="input h-40 font-mono text-[11px] leading-[1.4]" />
        <button type="button" onClick={copy} className="btn btn-ink">
          {copied ? "Copied" : "Copy layout"}
        </button>
      </aside>
    </main>
  );
}
