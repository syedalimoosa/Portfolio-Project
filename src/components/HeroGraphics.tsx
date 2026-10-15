import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Texture, Triangle, Vec2 } from "ogl";

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export function HeroWebGL() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = host.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const test = document.createElement("canvas");
    const probe = test.getContext("webgl");
    if (!probe) return;
    probe.getExtension("WEBGL_lose_context")?.loseContext();
    try {
      const canvas = document.createElement("canvas");
      canvas.className = "hero-webgl-canvas";
      const renderer = new Renderer({ canvas, webgl: 1, alpha: true, antialias: false, depth: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5), powerPreference: "low-power" });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      container.appendChild(canvas);
      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex,
        fragment: `
          precision highp float;
          uniform vec2 uResolution;
          uniform vec2 uMouse;
          uniform float uTime;
          varying vec2 vUv;
          float blob(vec2 p, vec2 c, float r) { return exp(-dot(p-c,p-c)/r); }
          void main() {
            vec2 uv = vUv;
            vec2 p = uv - 0.5;
            p.x *= uResolution.x / max(uResolution.y, 1.0);
            vec2 m = uMouse - 0.5;
            m.x *= uResolution.x / max(uResolution.y, 1.0);
            float t = uTime * 0.11;
            vec2 drift1 = vec2(sin(t), cos(t * 0.8)) * 0.11;
            vec2 drift2 = vec2(cos(t * 0.7), sin(t * 0.9)) * 0.13;
            float haze = blob(p, vec2(0.22, 0.14) + drift1, 0.18) * 0.65;
            haze += blob(p, vec2(-0.28, -0.16) + drift2, 0.11) * 0.48;
            haze += blob(p, vec2(0.04, -0.32) - drift1 * 0.55, 0.075) * 0.34;
            float pointerGlow = blob(p, m, 0.16) * 0.9;
            float grain = fract(sin(dot(uv * (uTime + 1.0), vec2(12.9898,78.233))) * 43758.5453) * 0.018;
            vec3 color = vec3(0.027, 0.075, 0.055);
            color += vec3(0.09, 0.34, 0.23) * haze;
            color += vec3(0.26, 0.72, 0.48) * pointerGlow;
            color += vec3(0.54, 0.78, 0.18) * pointerGlow * pointerGlow * 0.3;
            color += grain;
            gl_FragColor = vec4(color, clamp(0.22 + haze * 0.22 + pointerGlow * 0.19, 0.0, 0.52));
          }`,
        uniforms: { uResolution: { value: new Vec2(1, 1) }, uMouse: { value: new Vec2(0.72, 0.55) }, uTime: { value: 0 } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new Mesh(gl, { geometry, program });
      const pointer = new Vec2(.72, .55);
      const target = new Vec2(.72, .55);
      const resize = () => {
        const rect = container.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setSize(width, height);
        program.uniforms.uResolution.value.set(width * renderer.dpr, height * renderer.dpr);
      };
      const move = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        target.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
      };
      const leave = () => target.set(.72, .55);
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      const surface = container.parentElement ?? container;
      surface.addEventListener("pointermove", move);
      surface.addEventListener("pointerleave", leave);
      resize();
      let frame = 0;
      const render = (time: number) => {
        pointer.x += (target.x - pointer.x) * .055;
        pointer.y += (target.y - pointer.y) * .055;
        program.uniforms.uMouse.value.copy(pointer);
        program.uniforms.uTime.value = time * .001;
        renderer.render({ scene: mesh });
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        surface.removeEventListener("pointermove", move);
        surface.removeEventListener("pointerleave", leave);
        canvas.remove();
        const lose = gl.getExtension("WEBGL_lose_context");
        lose?.loseContext();
      };
    } catch {
      return;
    }
  }, []);
  return <div className="hero-webgl" ref={host} aria-hidden="true" />;
}

export function HeroDistortion({ src, alt, active }: { src: string; alt: string; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState(false);
  const engine = useRef<{ texture: Texture; program: Program } | null>(null);
  useEffect(() => {
    const container = host.current;
    if (!container || !active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const test = document.createElement("canvas");
    const probe = test.getContext("webgl");
    if (!probe) return;
    probe.getExtension("WEBGL_lose_context")?.loseContext();
    const canvas = document.createElement("canvas");
    canvas.className = "distortion-canvas";
    let cleanup = () => {};
    try {
      const renderer = new Renderer({ canvas, webgl: 1, alpha: true, antialias: false, depth: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5), powerPreference: "low-power" });
      const gl = renderer.gl;
      const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, flipY: true });
      const geometry = new Triangle(gl);
      const mouse = new Vec2(.5, .5);
      const target = new Vec2(.5, .5);
      const program = new Program(gl, {
        vertex,
        fragment: `
          precision highp float;
          uniform sampler2D tMap;
          uniform vec2 uMouse;
          uniform vec2 uResolution;
          uniform vec2 uImageSize;
          uniform float uTime;
          uniform float uActive;
          varying vec2 vUv;
          void main() {
            vec2 ratio = vec2(min(uResolution.x/uResolution.y, uImageSize.x/uImageSize.y), min(uImageSize.y/uImageSize.x, uResolution.y/uResolution.x));
            vec2 uv = (vUv - 0.5) * ratio + 0.5;
            vec2 delta = uv - uMouse;
            float dist = length(delta);
            float wave = sin(dist * 44.0 - uTime * 5.5) * exp(-dist * 11.0) * uActive * 0.009;
            vec2 direction = delta / max(dist, 0.001);
            vec2 warped = uv + direction * wave;
            vec2 split = direction * uActive * exp(-dist * 8.0) * 0.003;
            float r = texture2D(tMap, warped + split).r;
            float g = texture2D(tMap, warped).g;
            float b = texture2D(tMap, warped - split).b;
            gl_FragColor = vec4(r, g, b, 1.0);
          }`,
        uniforms: {
          tMap: { value: texture }, uMouse: { value: mouse }, uResolution: { value: new Vec2(1, 1) },
          uImageSize: { value: new Vec2(1, 1) }, uTime: { value: 0 }, uActive: { value: 0 },
        },
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new Mesh(gl, { geometry, program });
      engine.current = { texture, program };
      container.appendChild(canvas);
      const resize = () => {
        const rect = container.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
        program.uniforms.uResolution.value.set(rect.width * renderer.dpr, rect.height * renderer.dpr);
      };
      const move = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        target.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
        program.uniforms.uActive.value = 1;
      };
      const leave = () => { program.uniforms.uActive.value = 0; target.set(.5, .5); };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      container.addEventListener("pointermove", move);
      container.addEventListener("pointerleave", leave);
      resize();
      let frame = 0;
      const render = (time: number) => {
        mouse.x += (target.x - mouse.x) * .15;
        mouse.y += (target.y - mouse.y) * .15;
        program.uniforms.uMouse.value.copy(mouse);
        program.uniforms.uTime.value = time * .001;
        renderer.render({ scene: mesh });
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        container.removeEventListener("pointermove", move);
        container.removeEventListener("pointerleave", leave);
        engine.current = null;
        canvas.remove();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    } catch {
      setWebglReady(false);
    }
    return () => cleanup();
  }, [active]);
  useEffect(() => {
    const current = engine.current;
    if (!active || !current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled || !engine.current) return;
      current.texture.image = image;
      current.program.uniforms.uImageSize.value.set(image.naturalWidth, image.naturalHeight);
      setWebglReady(true);
    };
    image.onerror = () => { if (!cancelled) setWebglReady(false); };
    image.src = src;
    return () => { cancelled = true; image.onload = null; image.onerror = null; };
  }, [src, active]);
  return <div ref={host} className={`distortion-media ${webglReady ? "webgl-ready" : ""} ${active ? "is-active" : ""}`}><img src={src} alt={alt} /><span className="distortion-fallback-glow" aria-hidden="true" /></div>;
}
