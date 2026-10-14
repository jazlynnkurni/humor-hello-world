"use client";

import { useEffect, useRef } from "react";
import { CROWN_BOX, CROWN_PATH } from "./crown-path";

/**
 * A postage stamp struck from her texture lab (~/Desktop/revamp-proto/texture-lab):
 * the same height field, the same raking lamp from the upper left, the same
 * postcard stock, and the stamp die traced with its teeth biting inward. On top
 * of the stock a crown is embossed: raised out of the card, lit by the lamp,
 * no ink. It lifts and tilts a little toward the hand.
 */
const LAMP = norm3(-0.58, -0.66, 0.48);
const HALF = norm3(LAMP[0], LAMP[1], LAMP[2] + 1);

function norm3(x: number, y: number, z: number): [number, number, number] {
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}
function hash(x: number, y: number, s: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function swell(x: number, y: number, W: number, H: number, f: number, phase: number) {
  const u = (x / W) * Math.PI * 2, v = (y / H) * Math.PI * 2;
  return Math.sin(u * f + phase) * Math.sin(v * f + phase * 1.7);
}


/* the stamp die: teeth biting inward, a whole tooth kept at every corner */
function diePath(c: CanvasRenderingContext2D, w: number, h: number) {
  const R = Math.min(w, h) * 0.03;
  const run = (len: number) => Math.max(2, Math.round((len - R * 4.4) / (R * 2)));
  const corner = R * 2.2;
  c.moveTo(corner, 0);
  const nTop = run(w), stepT = (w - corner * 2) / nTop;
  for (let i = 0; i < nTop; i++) { const m = corner + (i + 0.5) * stepT; c.lineTo(m - R, 0); c.arc(m, 0, R, Math.PI, 0, true); c.lineTo(m + R, 0); }
  c.lineTo(w, 0);
  const nR = run(h), stepR = (h - corner * 2) / nR;
  for (let i = 0; i < nR; i++) { const m = corner + (i + 0.5) * stepR; c.lineTo(w, m - R); c.arc(w, m, R, -Math.PI / 2, Math.PI / 2, true); c.lineTo(w, m + R); }
  c.lineTo(w, h);
  for (let i = nTop - 1; i >= 0; i--) { const m = corner + (i + 0.5) * stepT; c.lineTo(m + R, h); c.arc(m, h, R, 0, Math.PI, true); c.lineTo(m - R, h); }
  c.lineTo(0, h);
  for (let i = nR - 1; i >= 0; i--) { const m = corner + (i + 0.5) * stepR; c.lineTo(0, m + R); c.arc(0, m, R, Math.PI / 2, -Math.PI / 2, true); c.lineTo(0, m - R); }
  c.closePath();
}

/* a cheap separable box blur, run twice, which is near enough a gaussian for a die */
function blur(src: Float32Array, W: number, H: number, r: number) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let pass = 0; pass < 2; pass++) {
    const from = pass === 0 ? src : out;
    for (let y = 0; y < H; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += from[y * W + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * r + 1); acc += from[y * W + Math.min(W - 1, x + r + 1)] - from[y * W + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) { out[y * W + x] = acc / (2 * r + 1); acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
  }
  return out;
}

/* the plate: stock + emboss, shaded by the lamp */
function strike(W: number, H: number, dark: boolean): ImageData {
  /* the emboss mask, drawn then softened so the relief has shoulders */
  const mc = document.createElement("canvas"); mc.width = W; mc.height = H;
  const m = mc.getContext("2d")!;
  m.fillStyle = "#000"; m.fillRect(0, 0, W, H);
  m.fillStyle = "#fff";
  /* an inner rule, as a stamp carries */
  const inset = Math.min(W, H) * 0.085, rule = Math.max(1.5, Math.min(W, H) * 0.012);
  m.fillRect(inset, inset, W - inset * 2, rule); m.fillRect(inset, H - inset - rule, W - inset * 2, rule);
  m.fillRect(inset, inset, rule, H - inset * 2); m.fillRect(W - inset - rule, inset, rule, H - inset * 2);
  /* the crown itself, fitted to half the card's width and centred a little above the middle */
  const cw = Math.min(W, H) * 0.52, k = cw / CROWN_BOX.w, ch = CROWN_BOX.h * k;
  m.save();
  m.translate((W - cw) / 2, H * 0.5 - ch * 0.52);
  m.scale(k, k);
  m.translate(-CROWN_BOX.x, -CROWN_BOX.y);
  m.fill(new Path2D(CROWN_PATH));
  m.restore();
  const md = m.getImageData(0, 0, W, H).data;
  let mask = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = md[i * 4] / 255;
  /* a light soften only: the crown's small cutouts have to survive */
  mask = blur(mask, W, H, Math.max(1, Math.round(Math.min(W, H) * 0.004)));

  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    /* card tooth at device pixels, kept quiet so the die reads over it */
    h[i] = (hash(x, y, 6) - 0.5) * 0.07 + (hash(x >> 1, y >> 1, 12) - 0.5) * 0.12 + (hash(x >> 2, y >> 2, 18) - 0.5) * 0.16
         + swell(x, y, W, H, 3, 0.2) * 0.08
         + mask[i] * 2.3;                      /* the die */
  }

  const card = dark ? [206, 198, 182] : [228, 220, 202];
  const relief = 40, amb = 0.76, diff = 0.3, spec = 0.06, shine = 6;
  const out = new ImageData(W, H), d = out.data;
  const at = (x: number, y: number) => h[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dx = (at(x + 1, y) - at(x - 1, y)) * relief, dy = (at(x, y + 1) - at(x, y - 1)) * relief;
    const n = norm3(-dx, -dy, 1);
    const df = Math.max(0, n[0] * LAMP[0] + n[1] * LAMP[1] + n[2] * LAMP[2]);
    const sp = Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), shine) * spec;
    const lum = amb + diff * df;
    /* the raised face catches a hair more light, as pressed card does */
    const k = lum + mask[i] * 0.05 + sp;
    const o = i * 4;
    d[o] = Math.min(255, card[0] * k); d[o + 1] = Math.min(255, card[1] * k); d[o + 2] = Math.min(255, card[2] * k); d[o + 3] = 255;
  }
  return out;
}

export function Stamp({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext("2d")!;
    let plate: HTMLCanvasElement | null = null, pw = 0, ph = 0, pdark = false;
    let W = 0, H = 0, dpr = 1;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0, lift: 0, tl: 0 };
    let raf = 0, alive = true;
    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

    function ensurePlate() {
      /* the card is 78% of the canvas, leaving room for the lift and the shadow */
      const w = Math.round(W * 0.78), h = Math.round(w * 1.2);
      const dark = isDark();
      if (plate && pw === w && ph === h && pdark === dark) return;
      const cvp = document.createElement("canvas"); cvp.width = w; cvp.height = h;
      cvp.getContext("2d")!.putImageData(strike(w, h, dark), 0, 0);
      plate = cvp; pw = w; ph = h; pdark = dark;
    }

    function draw() {
      raf = 0;
      if (!alive || !plate) return;
      tilt.x += (tilt.tx - tilt.x) * 0.08; tilt.y += (tilt.ty - tilt.y) * 0.08; tilt.lift += (tilt.tl - tilt.lift) * 0.08;
      const L = tilt.lift, dark = isDark();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, W, H);
      c.save();
      c.translate(W / 2, H / 2 - L * 6 * dpr);
      c.rotate(-0.018 + tilt.x * 0.012);
      const grow = 1 + L * 0.016;
      c.scale(grow, grow);
      c.translate(-pw / 2, -ph / 2);
      c.beginPath(); diePath(c, pw, ph);
      c.shadowColor = dark ? `rgba(0,0,0,${0.42 + L * 0.2})` : `rgba(20,23,27,${0.16 + L * 0.1})`;
      c.shadowBlur = (20 + L * 26) * dpr; c.shadowOffsetY = (8 + L * 16) * dpr; c.shadowOffsetX = (2 + tilt.x * 4) * dpr;
      c.fillStyle = "#000"; c.fill();
      c.shadowColor = "transparent";
      c.save(); c.clip(); c.drawImage(plate, 0, 0); c.restore();
      c.restore();
      const moving = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) + Math.abs(tilt.tl - tilt.lift) > 0.002;
      if (moving) raf = requestAnimationFrame(draw);
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(draw); };

    function resize() {
      const r = cv!.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
      cv!.width = W; cv!.height = H;
      ensurePlate(); wake();
    }

    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);
    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; tilt.tl = 1; wake(); };
    const onLeave = () => { tilt.tx = 0; tilt.ty = 0; tilt.tl = 0; wake(); };
    const onTheme = () => { ensurePlate(); wake(); };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave);
    addEventListener("themechange", onTheme);
    return () => {
      alive = false; if (raf) cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); removeEventListener("themechange", onTheme);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
