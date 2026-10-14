"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The opening. Columbia blue, then HA HA HA bursts from the middle, the words
 * fall and pile up on the ground, the blue blurs and fades to paper, and the
 * HAs turn to ink and stay where they fell. Plays once a session. A click
 * skips to the end. Reduced motion goes straight to the pile.
 */
const BLUE = "#b9d9eb";
const N = 40;

type Word = { text: string; x: number; y: number; vx: number; vy: number; r: number; vr: number; size: number; w: number; h: number; landed: boolean; born: number };

export function HaIntro() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"off" | "blue" | "paper" | "done">("off");

  useEffect(() => {
    let saved: { W: number; H: number; words: Word[] } | null = null;
    try { const raw = sessionStorage.getItem("ha-pile"); if (raw) saved = JSON.parse(raw); } catch {}
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const replay = !saved;
    setPhase(replay ? "blue" : "done");

    const cv = ref.current!;
    const c = cv.getContext("2d")!;
    let W = 0, H = 0, dpr = 1, raf = 0, alive = true;
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-jak") || "sans-serif";
    const ink = () => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#14171b";

    const words: Word[] = [];
    const cols = 48; const pile = new Float32Array(cols);
    let t0 = 0, fading = false, settledAt = 0;
    let bg = 1;            /* 1 = blue, 0 = gone */
    let inkMix = 0;        /* 0 = white words, 1 = ink words */

    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
    }
    resize();

    function spawn(now: number) {
      const cx = W / 2, cy = H * 0.42;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const sp = 9 + Math.random() * 15;
        const size = Math.round(Math.min(W, H) * (W < 640 ? 0.05 + Math.random() * 0.06 : 0.035 + Math.random() * 0.055));
        const text = Math.random() < 0.18 ? "HAHA" : "HA";
        c.font = `700 ${size}px ${fam}`;
        const w = c.measureText(text).width, h = size * 0.74;
        words.push({ text, x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, r: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 0.12, size, w, h, landed: false, born: now + i * 14 });
      }
    }

    function step(dt: number, now: number) {
      const ground = H - 20;
      let allLanded = true;
      for (const wd of words) {
        if (now < wd.born) { allLanded = false; continue; }
        if (wd.landed) continue;
        allLanded = false;
        const age = (now - wd.born) / 1000;
        /* the burst eases off, then gravity takes it */
        const g = age < 0.55 ? 0.18 : 1.25;
        wd.vy += g * dt * 60; wd.vx *= Math.pow(0.985, dt * 60); wd.vr *= Math.pow(0.99, dt * 60);
        wd.x += wd.vx * dt * 60; wd.y += wd.vy * dt * 60; wd.r += wd.vr * dt * 60;
        if (wd.x < wd.w / 2) { wd.x = wd.w / 2; wd.vx = Math.abs(wd.vx) * 0.5; }
        if (wd.x > W - wd.w / 2) { wd.x = W - wd.w / 2; wd.vx = -Math.abs(wd.vx) * 0.5; }
        /* land on the pile under this word's span */
        const c0 = Math.max(0, Math.floor(((wd.x - wd.w / 2) / W) * cols)), c1 = Math.min(cols - 1, Math.floor(((wd.x + wd.w / 2) / W) * cols));
        let top = 0; for (let k = c0; k <= c1; k++) top = Math.max(top, pile[k]);
        /* the floor is the bottom fifth of the window: words overlap there like
           paper on a floor instead of stacking into a mound that climbs the page */
        const cap = H * (W < 640 ? 0.12 : 0.17);
        const rest = ground - Math.min(top, cap) - wd.h / 2;
        if (wd.vy > 0 && wd.y >= rest) {
          wd.y = rest; wd.landed = true; wd.vx = 0; wd.vy = 0;
          wd.r = (Math.random() - 0.5) * 0.5;
          const lift = wd.h * 0.3;
          for (let k = c0; k <= c1; k++) pile[k] = Math.min(cap, top + lift);
        }
      }
      return allLanded;
    }

    function draw(now: number) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      if (bg > 0) {
        c.fillStyle = BLUE; c.fillRect(0, 0, W, H);
        /* the blue does not switch off, it dissolves: a soft-edged wash of paper
           opens from the middle and swallows it, which is what reads as blur */
        if (bg < 1) {
          const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#faf9f7";
          const reach = (1 - bg) * Math.hypot(W, H) * 0.75;
          const g = c.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(1, reach));
          g.addColorStop(0, paper); g.addColorStop(0.55, paper); g.addColorStop(1, "rgba(250,249,247,0)");
          c.fillStyle = g; c.fillRect(0, 0, W, H);
        }
      }
      const inkCol = ink();
      for (const wd of words) {
        if (now < wd.born) continue;
        c.save(); c.translate(wd.x, wd.y); c.rotate(wd.r);
        c.font = `700 ${wd.size}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillStyle = inkMix < 0.5 ? "#ffffff" : inkCol;
        c.fillText(wd.text, 0, 0);
        c.restore();
      }
    }
    function remember() {
      try { sessionStorage.setItem("ha-pile", JSON.stringify({ W, H, words: words.map((w) => ({ ...w })) })); } catch {}
    }

    let prev = 0;
    function frame(now: number) {
      raf = 0; if (!alive) return;
      if (!t0) { t0 = now; spawn(now); prev = now; }
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      const settled = step(dt, now);
      if (settled && !settledAt) settledAt = now;
      if (settledAt && !fading && now - settledAt > 350) { fading = true; setPhase("paper"); }
      if (fading) {
        const k = Math.min(1, (now - settledAt - 350) / 900);
        bg = 1 - k; inkMix = k;
      }
      draw(now);
      if (fading && bg <= 0) { setPhase("done"); remember(); return; }
      raf = requestAnimationFrame(frame);
    }

    function finish() {
      /* skip: everything lands where it would have, blue gone, words ink */
      if (!t0) { t0 = performance.now(); spawn(t0 - 5000); }
      for (let i = 0; i < 400; i++) if (step(1 / 60, performance.now() + 100000)) break;
      bg = 0; inkMix = 1; fading = true; settledAt = 1;
      draw(performance.now() + 100000);
      setPhase("done"); remember();
      if (raf) cancelAnimationFrame(raf); raf = 0;
    }
    function restore() {
      /* the pile from earlier in the session, scaled to this window */
      if (!saved) return;
      const sx = W / saved.W, sy = H / saved.H;
      for (const w of saved.words) words.push({ ...w, x: w.x * sx, y: H - (saved.H - w.y) * sy, size: w.size * Math.min(sx, sy), landed: true, born: 0 });
      bg = 0; inkMix = 1; fading = true; settledAt = 1;
      draw(performance.now() + 100000);
    }

    document.fonts?.load(`700 32px ${fam}`).finally(() => {
      if (!alive) return;
      if (!replay) restore();
      else if (reduce) finish();
      else raf = requestAnimationFrame(frame);
    });
    const onResize = () => { resize(); if (!raf) draw(performance.now() + 100000); };
    const onSkip = () => { if (bg > 0) finish(); };
    addEventListener("resize", onResize);
    addEventListener("pointerdown", onSkip, { once: true });
    addEventListener("keydown", onSkip, { once: true });
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); removeEventListener("resize", onResize); removeEventListener("pointerdown", onSkip); removeEventListener("keydown", onSkip); };
  }, []);

  /* the canvas is always mounted, so the effect can draw into it on the first frame */
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: phase === "blue" || phase === "paper" ? 50 : 0 }}
    />
  );
}
