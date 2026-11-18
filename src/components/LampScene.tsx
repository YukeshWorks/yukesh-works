import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * A rainy-night street lamp, drawn live on a canvas at the screen's real resolution
 * (replaces the old 360px GIF). Static parts are pre-rendered once per resize; each
 * frame only blits those layers and moves the rain, dust, moths and fog.
 *
 * Animations: lamp switches on with a flicker, idle hum + random flickers, rain that
 * lights up inside the beam, splashes in the light pool, glowing dust, moths around the
 * bulb, two drifting fog layers with mouse parallax, and an occasional distant lightning.
 */

const LIGHT = "255, 236, 205";

type Layout = {
  w: number; h: number; s: number;
  lx: number; ly: number; ground: number;
  topHalf: number; spread: number; baseX: number;
};

const getLayout = (w: number, h: number): Layout => {
  const mobile = w < 768;
  const s = Math.max(0.5, Math.min(1.4, mobile ? w / 680 : Math.min(w / 1700, h / 950)));
  const lx = w * (mobile ? 0.66 : 0.64);
  const ly = h * (mobile ? 0.21 : 0.24);
  const ground = h * 0.97;
  return {
    w, h, s, lx, ly, ground,
    topHalf: 62 * s,
    spread: Math.max(150 * s, (ground - ly) * 0.42),
    baseX: w * (mobile ? 0.06 : 0.1),
  };
};

const makeCanvas = (w: number, h: number, dpr: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, ctx };
};

// Lamp head drawn in local units around the bulb; rotated so it rises to the right.
const HEAD_ANGLE = -0.17;
const withHead = (ctx: CanvasRenderingContext2D, L: Layout, fn: () => void) => {
  ctx.save();
  ctx.translate(L.lx, L.ly);
  ctx.rotate(HEAD_ANGLE);
  ctx.scale(L.s, L.s);
  fn();
  ctx.restore();
};

const drawStatic = (ctx: CanvasRenderingContext2D, L: Layout) => {
  const { w, h, s, lx, ly, baseX } = L;

  // Night sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#020203");
  sky.addColorStop(0.6, "#050506");
  sky.addColorStop(1, "#08080a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Soft static cloud banks
  const clouds = [
    [0.2, 0.18, 0.5], [0.55, 0.1, 0.45], [0.85, 0.3, 0.4], [0.35, 0.55, 0.55], [0.75, 0.75, 0.5],
  ];
  for (const [cx, cy, r] of clouds) {
    const g = ctx.createRadialGradient(cx * w, cy * h, 0, cx * w, cy * h, r * Math.max(w, h));
    g.addColorStop(0, "rgba(36, 38, 44, 0.14)");
    g.addColorStop(1, "rgba(36, 38, 44, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Where the arm meets the lamp head (local (-150, -14) rotated into place).
  const ax = lx + (-150 * Math.cos(HEAD_ANGLE) - -14 * Math.sin(HEAD_ANGLE)) * s;
  const ay = ly + (-150 * Math.sin(HEAD_ANGLE) + -14 * Math.cos(HEAD_ANGLE)) * s;

  const poleColor = "#1f2026";
  ctx.lineCap = "round";

  // Main curved pole
  ctx.strokeStyle = poleColor;
  ctx.lineWidth = 13 * s;
  ctx.beginPath();
  ctx.moveTo(baseX, h + 20);
  ctx.bezierCurveTo(baseX - 4 * s, ly + 0.42 * (h - ly), baseX + 0.22 * (ax - baseX), ly - 70 * s, ax, ay);
  ctx.stroke();

  // Rim light on the side facing the lamp
  ctx.strokeStyle = `rgba(${LIGHT}, 0.16)`;
  ctx.lineWidth = 2.2 * s;
  ctx.beginPath();
  ctx.moveTo(baseX + 6 * s, h + 20);
  ctx.bezierCurveTo(baseX + 2 * s, ly + 0.42 * (h - ly) - 4 * s, baseX + 0.22 * (ax - baseX) + 4 * s, ly - 64 * s, ax, ay + 5 * s);
  ctx.stroke();

  // Lower support strut with clamps
  // Strut springs from the top of the base post so it is visibly attached.
  const sx = baseX + 4 * s;
  const sy = h * 0.74;
  ctx.strokeStyle = poleColor;
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(sx + 20 * s, ly + 0.1 * (h - ly), sx + 0.35 * (ax - sx), ly - 10 * s, ax - 30 * s, ay + 14 * s);
  ctx.stroke();
  ctx.fillStyle = poleColor;
  for (const t of [0.3, 0.62]) {
    const px = sx + t * (ax - sx);
    const py = sy + t * (ay - sy) - Math.sin(t * Math.PI) * 0.18 * (sy - ay);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.7 + t * 0.6);
    ctx.fillRect(-5 * s, -11 * s, 10 * s, 22 * s);
    ctx.restore();
  }

  // Short heavy post at the base
  ctx.fillStyle = "#1a1b20";
  ctx.fillRect(baseX - 15 * s, h * 0.74, 30 * s, h * 0.3);
  ctx.fillStyle = `rgba(${LIGHT}, 0.08)`;
  ctx.fillRect(baseX + 11 * s, h * 0.74, 4 * s, h * 0.3);

  // Lamp housing
  withHead(ctx, L, () => {
    const body = ctx.createLinearGradient(0, -58, 0, 2);
    body.addColorStop(0, "#3a3b42");
    body.addColorStop(1, "#1d1e23");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-158, -12);
    ctx.bezierCurveTo(-120, -36, -10, -58, 92, -56);
    ctx.bezierCurveTo(120, -55, 128, -38, 118, -20);
    ctx.bezierCurveTo(110, -6, 96, -2, 80, -2);
    ctx.lineTo(-62, 2);
    ctx.bezierCurveTo(-110, 2, -150, -2, -158, -12);
    ctx.closePath();
    ctx.fill();
    // top highlight
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-120, -32);
    ctx.bezierCurveTo(-40, -52, 40, -58, 100, -52);
    ctx.stroke();
    // lip under the housing, lit by the bulb
    ctx.fillStyle = "#2a2b31";
    ctx.beginPath();
    ctx.ellipse(28, -3, 96, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawCone = (ctx: CanvasRenderingContext2D, L: Layout) => {
  const { s, lx, ly, ground, topHalf, spread, w, h } = L;
  const top = ly + 8 * s;

  // Halo around the bulb
  const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 330 * s);
  halo.addColorStop(0, `rgba(${LIGHT}, 0.22)`);
  halo.addColorStop(0.35, `rgba(${LIGHT}, 0.06)`);
  halo.addColorStop(1, `rgba(${LIGHT}, 0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  // Beam: blurred where canvas filters exist; otherwise many thin stacked layers fake the soft edge.
  const blur = `blur(${Math.round(26 * s)}px)`;
  ctx.filter = blur;
  const hasFilter = ctx.filter === blur;
  const layers = hasFilter ? 3 : 24;
  for (let i = 0; i < layers; i++) {
    const k = hasFilter ? 0.7 + i * 0.25 : 0.55 + (i * 0.7) / layers;
    const a = hasFilter ? 0.1 : 0.015;
    const g = ctx.createLinearGradient(0, top, 0, ground);
    g.addColorStop(0, `rgba(${LIGHT}, ${a})`);
    g.addColorStop(0.5, `rgba(${LIGHT}, ${a * 0.5})`);
    g.addColorStop(1, `rgba(${LIGHT}, ${a * 0.22})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(lx - topHalf * Math.min(k, 1), top);
    ctx.lineTo(lx + topHalf * Math.min(k, 1), top);
    ctx.lineTo(lx + spread * k, ground);
    ctx.lineTo(lx - spread * k, ground);
    ctx.closePath();
    ctx.fill();
  }
  ctx.filter = "none";

  // Light pool on the wet ground
  ctx.save();
  ctx.translate(lx, ground);
  ctx.scale(1, 0.12);
  const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, spread * 1.05);
  pool.addColorStop(0, `rgba(${LIGHT}, 0.26)`);
  pool.addColorStop(0.6, `rgba(${LIGHT}, 0.06)`);
  pool.addColorStop(1, `rgba(${LIGHT}, 0)`);
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(0, 0, spread * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawFog = (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) => {
  let r = seed;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 22; i++) {
    const x = rand() * w;
    const y = h * (0.15 + rand() * 0.85);
    const rad = (0.12 + rand() * 0.22) * Math.max(w, h * 2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const a = 0.012 + rand() * 0.02;
    g.addColorStop(0, `rgba(120, 124, 132, ${a})`);
    g.addColorStop(1, "rgba(120, 124, 132, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
};

type Drop = { x: number; y: number; v: number; len: number };
type Mote = { x: number; y: number; vx: number; vy: number; r: number; tw: number };
type Splash = { x: number; y: number; age: number; size: number };

interface LampSceneProps {
  /** Skip the switch-on flicker (e.g. for a dimmed backdrop). */
  instant?: boolean;
  /** Canvas opacity for using the scene as a quiet backdrop. */
  opacity?: number;
  onReady?: () => void;
  /** Rendered centred inside the beam, above the canvas. */
  children?: ReactNode;
}

const LampScene = ({ instant = false, opacity = 1, onReady, children }: LampSceneProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let L = getLayout(1, 1);
    let dpr = 1;
    let staticLayer: HTMLCanvasElement | null = null;
    let coneLayer: HTMLCanvasElement | null = null;
    let fogB: HTMLCanvasElement | null = null;
    let drops: Drop[] = [];
    let motes: Mote[] = [];
    const splashes: Splash[] = [];

    const newDrop = (anyY: boolean): Drop => ({
      x: Math.random() * (L.w + 200) - 100,
      y: anyY ? Math.random() * L.h : -Math.random() * 120,
      v: (900 + Math.random() * 500) * Math.max(0.7, L.s),
      len: (14 + Math.random() * 16) * Math.max(0.7, L.s),
    });

    const newMote = (): Mote => {
      const t = Math.random();
      const y = L.ly + 20 * L.s + t * (L.ground - L.ly) * 0.75;
      const half = L.topHalf + (L.spread - L.topHalf) * ((y - L.ly) / (L.ground - L.ly));
      return {
        x: L.lx + (Math.random() * 2 - 1) * half * 0.8,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: 4 + Math.random() * 10,
        r: (0.7 + Math.random() * 1.5) * Math.max(0.8, L.s),
        tw: Math.random() * Math.PI * 2,
      };
    };

    const build = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);
      L = getLayout(w, h);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const st = makeCanvas(w, h, dpr); drawStatic(st.ctx, L); staticLayer = st.c;
      const co = makeCanvas(w, h, dpr); drawCone(co.ctx, L); coneLayer = co.c;
      // Fog is soft, so a half-resolution texture looks the same and is cheaper to blit.
      const fb = makeCanvas(w * 1.5, h, 0.5); drawFog(fb.ctx, w * 1.5, h, 91); fogB = fb.c;

      const rainCount = Math.min(260, Math.round((w * h) / 8000));
      drops = Array.from({ length: rainCount }, () => newDrop(true));
      motes = Array.from({ length: Math.round(28 + 20 * L.s) }, newMote);

      const ax = Math.min(Math.max(L.lx, 120), w - 120);
      setAnchor({ x: ax, y: L.ly + (L.ground - L.ly) * 0.52 });
    };

    // Lamp intensity: switch-on sequence, gentle hum, occasional flicker bursts.
    const startAt = performance.now();
    let flickerStart = startAt + 7000 + Math.random() * 6000;
    let flickerEnd = 0;
    let flickerSample = 0;
    let flickerValue = 1;
    let readyFired = false;
    let lightningAt = startAt + 15000 + Math.random() * 15000;
    let lightning = 0;

    const intensity = (now: number) => {
      const t = (now - startAt) / 1000;
      if (!instant && t < 1.5) {
        if (t < 0.25) return 0;
        if (t < 0.32) return 0.75;
        if (t < 0.45) return 0.08;
        if (t < 0.52) return 0.9;
        if (t < 0.7) return 0.2;
        return 0.55 + 0.45 * ((t - 0.7) / 0.8);
      }
      if (!readyFired) {
        readyFired = true;
        onReadyRef.current?.();
      }
      let I = 0.97 + 0.03 * Math.sin(t * 13) * Math.sin(t * 7.3);
      if (now >= flickerStart) {
        if (!flickerEnd) flickerEnd = now + 350 + Math.random() * 600;
        if (now - flickerSample > 55) {
          flickerSample = now;
          flickerValue = Math.random() < 0.5 ? 0.35 + Math.random() * 0.3 : 1;
        }
        I *= flickerValue;
        if (now > flickerEnd) {
          flickerEnd = 0;
          flickerValue = 1;
          flickerStart = now + 8000 + Math.random() * 10000;
        }
      }
      return I;
    };

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const beam = (x: number, y: number) => {
      if (y < L.ly) return 0;
      const f = (y - L.ly) / (L.ground - L.ly);
      const half = L.topHalf + (L.spread - L.topHalf) * f;
      const d = Math.abs(x - L.lx) / half;
      return d < 1 ? (1 - d * d) * (1 - 0.45 * f) : 0;
    };

    let last = performance.now();
    let raf = 0;
    const buckets: Drop[][] = [[], [], [], [], []];

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - startAt) / 1000;
      const { w, h, s, lx, ly, ground, spread } = L;
      const I = reduceMotion ? 1 : intensity(now);

      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (staticLayer) ctx.drawImage(staticLayer, 0, 0, w, h);

      const fogW = w * 1.5;

      // Beam and halo
      if (coneLayer) {
        ctx.globalAlpha = I;
        ctx.drawImage(coneLayer, 0, 0, w, h);
      }
      ctx.globalAlpha = 1;

      // Bulb
      withHead(ctx, L, () => {
        const g = ctx.createRadialGradient(28, 2, 0, 28, 2, 90);
        g.addColorStop(0, `rgba(255, 252, 245, ${0.95 * I + 0.05})`);
        g.addColorStop(0.55, `rgba(${LIGHT}, ${0.8 * I + 0.04})`);
        g.addColorStop(1, `rgba(${LIGHT}, ${0.15 * I})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(28, 2, 82, 15, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rain — brighter where it crosses the beam
      for (const b of buckets) b.length = 0;
      for (const d of drops) {
        if (!reduceMotion) {
          d.y += d.v * dt;
          d.x += d.v * 0.08 * dt;
        }
        if (d.y > ground) {
          if (Math.abs(d.x - lx) < spread * 0.95 && Math.random() < 0.55) {
            splashes.push({ x: d.x, y: ground - Math.random() * 10 * s, age: 0, size: (6 + Math.random() * 6) * s });
          }
          Object.assign(d, newDrop(false));
        }
        const c = beam(d.x, d.y) * I;
        const bi = Math.min(4, Math.floor(c * 5));
        buckets[bi].push(d);
      }
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(0.8, 1.1 * s);
      buckets.forEach((list, i) => {
        if (!list.length) return;
        ctx.strokeStyle = `rgba(${LIGHT}, ${0.05 + i * 0.13})`;
        ctx.beginPath();
        for (const d of list) {
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * 0.08, d.y - d.len);
        }
        ctx.stroke();
      });

      // Splashes in the light pool
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.age += dt;
        if (sp.age > 0.45) { splashes.splice(i, 1); continue; }
        const p = sp.age / 0.45;
        const c = Math.max(0, 1 - Math.abs(sp.x - lx) / spread);
        ctx.strokeStyle = `rgba(${LIGHT}, ${(1 - p) * 0.45 * c * I})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sp.size * (0.3 + p), sp.size * 0.22 * (0.3 + p), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glowing dust drifting in the beam
      for (const m of motes) {
        if (!reduceMotion) {
          m.x += (m.vx + Math.sin(t * 0.8 + m.tw) * 6) * dt;
          m.y += m.vy * dt;
        }
        if (m.y > ground - 20 * s || beam(m.x, m.y) <= 0.02) Object.assign(m, newMote());
        const c = beam(m.x, m.y);
        const a = c * I * (0.55 + 0.45 * Math.sin(t * 2.2 + m.tw));
        if (a <= 0.01) continue;
        ctx.fillStyle = `rgba(${LIGHT}, ${a})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moths circling the bulb
      for (let i = 0; i < 3; i++) {
        const ph = i * 2.1;
        const mx = lx + 20 * s + Math.cos(t * (1.7 + i * 0.4) + ph) * (70 + i * 25) * s + Math.sin(t * 5.3 + ph) * 8 * s;
        const my = ly + 30 * s + Math.sin(t * (2.3 + i * 0.3) + ph) * (22 + i * 9) * s + Math.cos(t * 6.1 + ph) * 5 * s;
        ctx.fillStyle = `rgba(${LIGHT}, ${0.75 * I})`;
        ctx.beginPath();
        ctx.arc(mx, my, 1.6 * Math.max(0.8, s), 0, Math.PI * 2);
        ctx.fill();
      }

      // Front fog (faster, subtle)
      if (fogB) {
        const off = ((t * 22) % fogW) + mouse.x * 40;
        ctx.globalAlpha = 1;
        ctx.drawImage(fogB, -off, mouse.y * 16, fogW, h);
        ctx.drawImage(fogB, fogW - off, mouse.y * 16, fogW, h);
        ctx.globalAlpha = 1;
      }

      // Distant lightning: two quick flashes, every 15–30 s
      if (!reduceMotion && now > lightningAt) {
        const lt = now - lightningAt;
        lightning = lt < 90 ? 1 : lt < 180 ? 0.2 : lt < 260 ? 0.7 : Math.max(0, 0.7 - (lt - 260) / 600);
        if (lt > 900) { lightning = 0; lightningAt = now + 15000 + Math.random() * 15000; }
      }
      if (lightning > 0) {
        ctx.fillStyle = `rgba(170, 180, 205, ${lightning * 0.09})`;
        ctx.fillRect(0, 0, w, h);
      }


      if (!reduceMotion) raf = requestAnimationFrame(frame);
    };

    build();
    const ro = new ResizeObserver(() => {
      build();
      if (reduceMotion) frame(performance.now());
    });
    ro.observe(wrap);

    if (reduceMotion) {
      frame(performance.now());
      onReadyRef.current?.();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [instant]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity }} aria-hidden="true" />
      {/* Vignette on the compositor instead of an extra canvas pass every frame */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 58% 45%, transparent 35%, rgba(0,0,0,0.7) 100%)" }}
      />
      {children && anchor && (
        <div className="absolute z-10" style={{ left: anchor.x, top: anchor.y, transform: "translate(-50%, -50%)" }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default LampScene;
