"use client";

import { useEffect, useRef } from "react";

/**
 * Columbia at night, as a dream. The photo is the texture; the shader softens it,
 * lets the windows and lamps breathe and flicker on their own clocks, drifts it very
 * slowly, lays film grain over it, and feathers every edge into the page's paper so
 * the scene has no frame. Two passes: a quarter-size bloom of the bright points,
 * then the composite.
 */
const VERT = `#version 300 es
void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const COMMON = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y); }
float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
/* the lights breathe as a drifting noise field: one slow, one quick with the odd dip.
   A field can only produce soft gradients, so nothing bands or boxes around a lamp. */
float flicker(vec2 uv, float t){
  float slow = vnoise(uv * vec2(14.0, 10.0) + vec2(t * 0.35, -t * 0.27));
  float quick = vnoise(uv * vec2(34.0, 24.0) + vec2(-t * 1.9, t * 1.3));
  float dip = smoothstep(0.86, 1.0, quick);
  return (0.84 + 0.16 * slow) * (1.0 - 0.35 * dip);
}`;

/* pass 1: bright pass, blurred wide, at quarter size */
const FRAG_BLOOM = `#version 300 es
precision highp float; out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uTime;
${COMMON}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 acc = vec3(0.0); float wsum = 0.0;
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.399963; float r = sqrt((float(i) + 0.5) / 24.0) * 0.022;
    vec2 off = vec2(cos(a), sin(a)) * r * vec2(uRes.y / uRes.x, 1.0);
    vec3 c = texture(uTex, uv + off).rgb;
    float b = smoothstep(0.42, 0.9, lum(c));
    float w = 1.0 - float(i) / 26.0;
    acc += c * b * w * flicker(uv + off, uTime); wsum += w;
  }
  o = vec4(acc / wsum, 1.0);
}`;

/* pass 2: the soft base, the bloom, the breathing lights, grain, and the feather */
const FRAG_MAIN = `#version 300 es
precision highp float; out vec4 o;
uniform sampler2D uTex; uniform sampler2D uBloom;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform vec3 uPaper; uniform float uMotion;
${COMMON}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * uMotion;
  /* a very slow drift and a hair of parallax, so it never sits still */
  vec2 drift = vec2(sin(t * 0.11), cos(t * 0.09)) * 0.006 + uPointer * 0.008;
  vec2 suv = (uv - 0.5) * 0.94 + 0.5 + drift;

  /* dreamy base: a soft disc blur */
  vec3 base = vec3(0.0); float ws = 0.0;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.399963; float r = sqrt((float(i) + 0.5) / 16.0) * 0.0045;
    vec2 off = vec2(cos(a), sin(a)) * r * vec2(uRes.y / uRes.x, 1.0);
    base += texture(uTex, suv + off).rgb; ws += 1.0;
  }
  base /= ws;

  /* the lights themselves breathe */
  float L = lum(base);
  float lit = smoothstep(0.35, 0.8, L);
  base *= mix(1.0, flicker(suv, t), lit);

  /* bloom from the quarter-size pass, warm */
  vec3 bloom = texture(uBloom, suv).rgb;
  vec3 col = base + bloom * vec3(1.15, 1.0, 0.85) * 0.9;

  /* a little lift and a cool shadow tint, the way night photos dream */
  col = pow(col, vec3(0.92));
  col = mix(col, col * vec3(0.9, 0.95, 1.12), 0.35 * (1.0 - lit));

  /* film grain, pinned to the pixel, moving */
  float g = hash(gl_FragCoord.xy + fract(t * 7.0) * 100.0) - 0.5;
  col += g * 0.045;

  /* feathered edges: a rounded rectangle, soft a fifth of the way in, into the paper */
  vec2 q = abs(uv - 0.5) * 2.0;
  vec2 rr = vec2(uRes.x / uRes.y, 1.0);
  vec2 d = max(q * rr - (rr - 0.42), 0.0);
  float edge = length(d) / 0.42;
  float mask = 1.0 - smoothstep(0.35, 1.0, edge);
  mask *= 1.0 - smoothstep(0.55, 1.6, length((uv - 0.5) * vec2(1.3, 1.9)));
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
function program(gl: WebGL2RenderingContext, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.trim().slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function DreamScene({ src = "/images/columbia-night.jpg", className = "" }: { src?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    let alive = true, raf = 0, visible = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pBloom = program(gl, FRAG_BLOOM), pMain = program(gl, FRAG_MAIN);
    const vao = gl.createVertexArray();
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([14, 16, 32]));

    const bloomTex = gl.createTexture()!, fbo = gl.createFramebuffer()!;
    let W = 0, H = 0, bw = 0, bh = 0, dpr = 1;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    let paper: [number, number, number] = [0.98, 0.976, 0.969];
    const readPaper = () => { paper = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue("--paper") || "#faf9f7"); };
    readPaper();

    function resize() {
      const r = cv!.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
      cv!.width = W; cv!.height = H;
      bw = Math.max(1, W >> 2); bh = Math.max(1, H >> 2);
      gl!.bindTexture(gl!.TEXTURE_2D, bloomTex);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, bw, bh, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, bloomTex, 0);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }

    const t0 = performance.now();
    function draw(now: number) {
      raf = 0;
      if (!alive) return;
      const t = (now - t0) / 1000;
      ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
      gl!.bindVertexArray(vao);

      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo); gl!.viewport(0, 0, bw, bh);
      gl!.useProgram(pBloom);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.uniform1i(gl!.getUniformLocation(pBloom, "uTex"), 0);
      gl!.uniform2f(gl!.getUniformLocation(pBloom, "uRes"), bw, bh);
      gl!.uniform1f(gl!.getUniformLocation(pBloom, "uTime"), reduce ? 0 : t);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null); gl!.viewport(0, 0, W, H);
      gl!.useProgram(pMain);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, bloomTex);
      gl!.uniform1i(gl!.getUniformLocation(pMain, "uTex"), 0);
      gl!.uniform1i(gl!.getUniformLocation(pMain, "uBloom"), 1);
      gl!.uniform2f(gl!.getUniformLocation(pMain, "uRes"), W, H);
      gl!.uniform1f(gl!.getUniformLocation(pMain, "uTime"), t);
      gl!.uniform2f(gl!.getUniformLocation(pMain, "uPointer"), ptr.x, ptr.y);
      gl!.uniform3f(gl!.getUniformLocation(pMain, "uPaper"), paper[0], paper[1], paper[2]);
      gl!.uniform1f(gl!.getUniformLocation(pMain, "uMotion"), reduce ? 0 : 1);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(draw); };

    /* the photo, flipped so uv (0,0) is the bottom-left the shader expects */
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      wake();
    };
    img.src = src;

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
  }, [src]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
