"use client";

import { useEffect } from "react";

/**
 * Her cursor, from jazlynnwashere.com: a charcoal bead a beat behind the
 * pointer, never bouncing. Over anything you can press it swells to a soft
 * glow; pressed, it tightens; over a data-cur element it opens into a pill
 * that says what the thing does. Only where there is a fine pointer to follow.
 */
const HOT = "a,button,[role=button],label,summary";

export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cur");
    const c = document.createElement("div");
    c.id = "cur";
    c.appendChild(document.createElement("i"));
    const lb = document.createElement("b");
    c.appendChild(lb);
    document.body.appendChild(c);

    let tx = -100, ty = -100, x = -100, y = -100, raf = 0, shown = false;
    function loop() {
      /* a plain ease toward the pointer: a beat behind it, never bouncing */
      x += (tx - x) * 0.42; y += (ty - y) * 0.42;
      c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(loop); else raf = 0;
    }
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { x = tx; y = ty; shown = true; c.classList.add("on"); }
      const el = e.target as HTMLElement | null;
      const t = el?.closest ? el.closest(HOT) : null;
      /* THE PILL. Over anything with a data-cur line the dot opens into a pill that says it. */
      const say = el?.closest ? (el.closest("[data-cur]") as HTMLElement | null) : null;
      if (say) {
        if (lb.textContent !== say.dataset.cur) lb.textContent = say.dataset.cur ?? "";
        c.style.setProperty("--pw", lb.scrollWidth + 34 + "px");
      }
      c.classList.toggle("pill", !!say);
      c.classList.toggle("hot", !!t && !say);
      c.classList.toggle("text", !t && !!el && getComputedStyle(el).cursor === "text");
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const down = () => c.classList.add("down"), up = () => c.classList.remove("down");
    const leave = () => c.classList.remove("on"), enter = () => { if (shown) c.classList.add("on"); };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", down); addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);
    return () => {
      removeEventListener("pointermove", onMove); removeEventListener("pointerdown", down); removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave); document.documentElement.removeEventListener("pointerenter", enter);
      if (raf) cancelAnimationFrame(raf);
      c.remove(); document.documentElement.classList.remove("has-cur");
    };
  }, []);
  return null;
}
