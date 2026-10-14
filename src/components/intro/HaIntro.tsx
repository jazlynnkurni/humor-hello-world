"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The opening. Columbia blue, then HA rains from the top the way the words do
 * in her rain-umbrella piece: each one falls nearly upright, gathering speed
 * toward a terminal velocity, drifts a little, lands on a per-column height
 * field and settles flat, so the pile stacks up row by row. When the last one
 * has landed the blue dissolves to paper from the centre and the HAs turn to
 * ink and stay where they fell. Plays on every load. A click or key skips.
 */
const BLUE = "#b9d9eb";
const COUNT = 48;          /* words in the shower */
const SPAWN_RATE = 20;     /* words per second */
const FALL_SPEED = 130;    /* initial downward speed, px/s */
const GRAVITY = 210;       /* px/s^2 */
const TERMINAL = 360;      /* px/s */
const PACK = 0.55;         /* how much of a word's height the pile rises per landing */
const COL_W = 6;

type Word = { text: string; x: number; y: number; vx: number; vy: number; rot: number; settleRot: number; size: number; w: number; h: number; landed: boolean };

export function HaIntro() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"blue" | "paper" | "done">("blue");

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-jak") || "sans-serif";
    const token = (n: string, fb: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb;

    let W = 0, H = 0, dpr = 1, raf = 0, alive = true;
    let ncols = 1, surface = new Float32Array(1);
    const words: Word[] = [];
    let spawned = 0, spawnTimer = 0.25, t0 = 0, prev = 0, settledAt = 0, fading = false;
    let bg = 1, inkMix = 0;

    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ncols = Math.max(1, Math.ceil(W / COL_W));
      const next = new Float32Array(ncols).fill(H);
      for (let i = 0; i < Math.min(ncols, surface.length); i++) next[i] = Math.min(surface[i], H);
      surface = next;
    }
    resize();

    function spawn() {
      const size = Math.round(Math.min(W, H) * (W < 640 ? 0.07 : 0.045)) + Math.round(Math.random() * 6);
      const text = Math.random() < 0.2 ? "HAHA" : "HA";
      c.font = `700 ${size}px ${fam}`;
      const w = c.measureText(text).width, h = size * 0.74;
      const settleRot = (Math.random() * 2 - 1) * 4 * (Math.PI / 180);
      words.push({ text, x: Math.random() * Math.max(1, W - w), y: -h - Math.random() * 60, vx: (Math.random() * 2 - 1) * 10, vy: FALL_SPEED, rot: settleRot, settleRot, size, w, h, landed: false });
      spawned++;
    }

    function settle(d: Word) {
      const c0 = Math.max(0, Math.floor(d.x / COL_W)), c1 = Math.min(ncols - 1, Math.floor((d.x + d.w) / COL_W));
      let rest = Infinity;
      for (let i = c0; i <= c1; i++) if (surface[i] < rest) rest = surface[i];
      d.y = rest - d.h; d.landed = true; d.vx = 0; d.vy = 0; d.rot = d.settleRot;
      /* the floor never climbs past a fifth of the window */
      const ns = Math.max(H * (W < 640 ? 0.86 : 0.8), rest - d.h * PACK);
      for (let i = c0; i <= c1; i++) if (ns < surface[i]) surface[i] = ns;
    }

    function step(dt: number) {
      let all = spawned >= COUNT;
      for (const d of words) {
        if (d.landed) continue;
        all = false;
        d.vy = Math.min(TERMINAL, d.vy + GRAVITY * dt);
        /* a hair of sideways drift toward the lower neighbouring column, so the
           pile spreads along the floor instead of climbing into towers */
        const ci = Math.max(1, Math.min(ncols - 2, Math.floor((d.x + d.w / 2) / COL_W)));
        const slope = surface[ci + 1] - surface[ci - 1];
        d.vx += Math.sign(slope) * Math.min(40, Math.abs(slope)) * dt * 6;
        d.vx *= 0.98;
        d.y += d.vy * dt; d.x += d.vx * dt;
        d.x = Math.max(0, Math.min(W - d.w, d.x));
        const c0 = Math.max(0, Math.floor(d.x / COL_W)), c1 = Math.min(ncols - 1, Math.floor((d.x + d.w) / COL_W));
        let rest = Infinity;
        for (let i = c0; i <= c1; i++) if (surface[i] < rest) surface[i] < rest && (rest = surface[i]);
        if (d.y + d.h >= rest) settle(d);
      }
      return all;
    }

    function draw() {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      if (bg > 0) {
        c.fillStyle = BLUE; c.fillRect(0, 0, W, H);
        if (bg < 1) {
          /* the blue does not switch off, it dissolves: a soft wash of paper opens from the middle */
          const paper = token("--paper", "#faf9f7");
          const n = parseInt(paper.slice(1), 16);
          const clear = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0)`;
          const reach = (1 - bg) * Math.hypot(W, H) * 0.75;
          const g = c.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(1, reach));
          g.addColorStop(0, paper); g.addColorStop(0.55, paper); g.addColorStop(1, clear);
          c.fillStyle = g; c.fillRect(0, 0, W, H);
        }
      }
      const ink = token("--ink", "#14171b");
      c.textAlign = "left"; c.textBaseline = "top";
      for (const d of words) {
        c.save(); c.translate(d.x + d.w / 2, d.y + d.h / 2); c.rotate(d.rot);
        c.font = `700 ${d.size}px ${fam}`;
        c.fillStyle = inkMix < 0.5 ? "#ffffff" : ink;
        c.fillText(d.text, -d.w / 2, -d.h / 2 - d.size * 0.1);
        c.restore();
      }
    }

    function frame(now: number) {
      raf = 0; if (!alive) return;
      if (!t0) { t0 = now; prev = now; }
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      if (spawned < COUNT) { spawnTimer -= dt; if (spawnTimer <= 0) { spawn(); spawnTimer = (0.5 + Math.random() * 1.0) / SPAWN_RATE; } }
      const settled = step(dt);
      if (settled && !settledAt) settledAt = now;
      if (settledAt && !fading && now - settledAt > 300) { fading = true; setPhase("paper"); }
      if (fading) { const k = Math.min(1, (now - settledAt - 300) / 900); bg = 1 - k; inkMix = k; }
      draw();
      if (fading && bg <= 0) { setPhase("done"); return; }
      raf = requestAnimationFrame(frame);
    }

    function finish() {
      while (spawned < COUNT) spawn();
      for (let i = 0; i < 2000 && !step(1 / 60); i++);
      bg = 0; inkMix = 1; fading = true; settledAt = 1;
      draw(); setPhase("done");
      if (raf) cancelAnimationFrame(raf); raf = 0;
    }

    document.fonts?.load(`700 32px ${fam}`).finally(() => {
      if (!alive) return;
      if (reduce) finish(); else raf = requestAnimationFrame(frame);
    });
    const onResize = () => { resize(); if (!raf) draw(); };
    const onSkip = () => { if (bg > 0) finish(); };
    addEventListener("resize", onResize);
    addEventListener("pointerdown", onSkip, { once: true });
    addEventListener("keydown", onSkip, { once: true });
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); removeEventListener("resize", onResize); removeEventListener("pointerdown", onSkip); removeEventListener("keydown", onSkip); };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: phase === "done" ? 0 : 50 }} />;
}
