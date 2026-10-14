"use client";

import { useEffect, useRef } from "react";

/**
 * City lights at night, in fog. Nothing is loaded; the whole scene is drawn by
 * the shader. A deep blue sky falls into a band of fog near the horizon, and a
 * scatter of lights sits in it at different depths: the far ones small, dim and
 * diffused, the near ones large soft bokeh. Each light breathes on a drifting
 * noise field. Film grain moves over it and every edge feathers into the paper.
 */
const VERT = `#version 300 es
void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float; out vec4 o;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform vec3 uPaper; uniform float uMotion;

float hash(float n){ return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1,0)), f.x), mix(hash2(i + vec2(0,1)), hash2(i + vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }

/* a light breathes: slow field, quick field with the odd dip */
float breathe(vec2 p, float t){
  float slow = vnoise(p * 3.0 + vec2(t * 0.25, -t * 0.2));
  float quick = vnoise(p * 9.0 + vec2(-t * 1.4, t * 1.1));
  return (0.78 + 0.22 * slow) * (1.0 - 0.4 * smoothstep(0.86, 1.0, quick));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);          /* centred, aspect-true, y up */
  float t = uTime * uMotion;

  /* sky: deep blue above, a fog band that warms toward the horizon */
  vec3 skyTop = vec3(0.035, 0.045, 0.11);
  vec3 skyLow = vec3(0.10, 0.11, 0.20);
  vec3 col = mix(skyLow, skyTop, smoothstep(-0.1, 0.5, p.y));

  /* fog: two drifting layers, thicker low down */
  float fog1 = fbm(p * 1.6 + vec2(t * 0.02, t * 0.008));
  float fog2 = fbm(p * 3.2 - vec2(t * 0.035, -t * 0.012) + 9.0);
  float fogAmt = smoothstep(0.45, -0.35, p.y) * (0.55 + 0.45 * fog1);
  vec3 fogCol = vec3(0.16, 0.15, 0.20) + vec3(0.07, 0.05, 0.02) * fog2;
  col = mix(col, fogCol, fogAmt * 0.6);

  /* the horizon's own glow, the city under the fog, kept low so the lights do the work */
  float hz = exp(-pow((p.y + 0.08) * 3.2, 2.0));
  col += vec3(0.30, 0.21, 0.11) * hz * (0.22 + 0.18 * fog2);

  /* the lights */
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 72; i++) {
    float fi = float(i);
    float depth = hash(fi * 7.1 + 1.3);                 /* 0 near .. 1 far */
    /* golden-ratio spacing across the width, jittered, so no side crowds */
    float x = (fract(fi * 0.6180339887 + 0.17) - 0.5) * 1.15 * asp + (hash(fi * 3.7 + 0.2) - 0.5) * 0.08;
    /* the far lights crowd the horizon, the near ones sit lower and spread */
    float y = mix(-0.32, 0.02, depth) + (hash(fi * 5.3 + 0.7) - 0.5) * mix(0.26, 0.18, depth);
    /* a few towers: lights above the band */
    if (hash(fi * 11.7) > 0.86) y += 0.18 + 0.22 * hash(fi * 13.1);
    vec2 c = vec2(x, y) + uPointer * (0.03 * (1.0 - depth));
    c.x += sin(t * 0.05 + fi) * 0.004 * (1.0 - depth);
    float d = length(p - c);
    float size = mix(0.026, 0.007, depth);
    float core = exp(-d * d / (size * size));
    float halo = exp(-d / (size * 5.0)) * 0.22;
    float b = breathe(c, t + fi * 0.37);
    float warm = hash(fi * 2.9 + 4.4);
    vec3 tint = warm > 0.82 ? vec3(0.62, 0.74, 1.0) : mix(vec3(1.0, 0.78, 0.46), vec3(1.0, 0.92, 0.75), hash(fi * 6.1));
    /* fog takes the far lights first */
    float fogOnLight = 1.0 - fogAmt * mix(0.25, 0.75, depth);
    glow += tint * (core + halo) * b * mix(0.8, 0.32, depth) * fogOnLight;
  }
  col += glow;

  /* a soft overall bloom of the band, as if the fog itself were lit */
  col += vec3(0.30, 0.22, 0.12) * exp(-pow((p.y + 0.14) * 2.4, 2.0)) * 0.10 * (0.6 + 0.4 * fog1);

  /* film grain, moving */
  float g = hash2(gl_FragCoord.xy + fract(t * 7.0) * 100.0) - 0.5;
  col += g * 0.04;
  col = pow(max(col, 0.0), vec3(0.95));

  /* feathered into the paper as a soft oval, so there is no edge or corner to read;
     the fall-off starts near the middle and only reaches the paper at the canvas edge */
  float r = length((uv - 0.5) * vec2(2.0, 2.3));
  float mask = 1.0 - smoothstep(0.28, 1.0, r);
  mask = pow(mask, 1.15);
  col = mix(uPaper, col, clamp(mask, 0.0, 1.0));
  o = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.trim().slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function DreamScene({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    let alive = true, raf = 0, visible = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prog = gl.createProgram()!;
    try {
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    } catch (e) {
      console.error(e);
      return;
    }
    const vao = gl.createVertexArray();
    const U = {
      res: gl.getUniformLocation(prog, "uRes"), time: gl.getUniformLocation(prog, "uTime"),
      ptr: gl.getUniformLocation(prog, "uPointer"), paper: gl.getUniformLocation(prog, "uPaper"), motion: gl.getUniformLocation(prog, "uMotion"),
    };

    let W = 0, H = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    let paper: [number, number, number] = [0.98, 0.976, 0.969];
    const readPaper = () => { paper = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue("--paper") || "#faf9f7"); };
    readPaper();

    function resize() {
      const r = cv!.getBoundingClientRect();
      if (!r.width) return;
      /* capped at 1.5x: the scene is soft by design and the loop runs every frame */
      const dpr = Math.min(1.5, devicePixelRatio || 1);
      W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
      cv!.width = W; cv!.height = H;
    }

    const t0 = performance.now();
    function draw(now: number) {
      raf = 0;
      if (!alive) return;
      const t = (now - t0) / 1000;
      ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
      gl!.bindVertexArray(vao);
      gl!.viewport(0, 0, W, H);
      gl!.useProgram(prog);
      gl!.uniform2f(U.res, W, H);
      gl!.uniform1f(U.time, reduce ? 40 : t);
      gl!.uniform2f(U.ptr, ptr.x, ptr.y);
      gl!.uniform3f(U.paper, paper[0], paper[1], paper[2]);
      gl!.uniform1f(U.motion, reduce ? 0 : 1);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(draw); };

    resize(); wake();
    const ro = new ResizeObserver(() => { resize(); wake(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); });
    io.observe(cv);
    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ptr.ty = -((e.clientY - r.top) / r.height - 0.5) * 2; };
    const onLeave = () => { ptr.tx = 0; ptr.ty = 0; };
    const onVis = () => wake();
    const onTheme = () => { readPaper(); wake(); };
    addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis); addEventListener("themechange", onTheme);

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis); removeEventListener("themechange", onTheme);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
