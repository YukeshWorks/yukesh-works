import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

/*
 * Scratch card: a holographic foil (with a moving shine) over a live, flowing rainbow.
 * Scratching throws sparks; at ~55% the foil dissolves, confetti bursts and the message
 * animates in. Pointer events cover mouse, pen and touch; a ring cursor shows brush size.
 */

const SPARK_COLORS = ["#ff4d6d", "#ff9f1c", "#ffe14d", "#4ade80", "#38bdf8", "#818cf8", "#e879f9"];
const REVEAL_AT = 55;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; r: number };

const RainbowScratch = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const rainbowRef = useRef<HTMLCanvasElement>(null);
  const foilRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const particles = useRef<Particle[]>([]);
  const revealedRef = useRef(false);
  const lastCheck = useRef(0);
  const [percent, setPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [brush, setBrush] = useState(34);
  const [round, setRound] = useState(0);

  const paintFoil = useCallback(() => {
    const c = foilRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#2b2d3a");
    g.addColorStop(0.35, "#4a4d5e");
    g.addColorStop(0.5, "#2f3140");
    g.addColorStop(0.75, "#545869");
    g.addColorStop(1, "#272935");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Holographic tint bands
    const holo = ctx.createLinearGradient(0, h, w, 0);
    ["rgba(255,77,109,0.10)", "rgba(255,225,77,0.08)", "rgba(74,222,128,0.08)", "rgba(56,189,248,0.10)", "rgba(232,121,249,0.10)"]
      .forEach((col, i, arr) => holo.addColorStop(i / (arr.length - 1), col));
    ctx.fillStyle = holo;
    ctx.fillRect(0, 0, w, h);
    // Grain
    for (let i = 0; i < (w * h) / 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    // Embossed label
    ctx.textAlign = "center";
    ctx.font = `800 ${Math.round(w / 22)}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillText("SCRATCH HERE", w / 2 + 1, h / 2 + 1);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillText("SCRATCH HERE", w / 2, h / 2);
    ctx.font = `500 ${Math.round(w / 42)}px Urbanist, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillText("something colourful is hiding underneath", w / 2, h / 2 + w / 24);
  }, []);

  const setup = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const w = box.clientWidth, h = box.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size.current = { w, h, dpr };
    for (const c of [rainbowRef.current, foilRef.current, fxRef.current]) {
      if (!c) continue;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    paintFoil();
  }, [paintFoil]);

  useEffect(() => {
    setup();
    const ro = new ResizeObserver(() => { if (!revealedRef.current) setup(); });
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [setup]);

  // Animation loop: flowing rainbow, foil shine, sparks.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let last = start;
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { w, h, dpr } = size.current;

      const rc = rainbowRef.current?.getContext("2d");
      if (rc && w) {
        rc.setTransform(dpr, 0, 0, dpr, 0, 0);
        rc.fillStyle = "#0b0614";
        rc.fillRect(0, 0, w, h);
        rc.globalCompositeOperation = "lighter";
        for (let i = 0; i < 6; i++) {
          const hue = (t * 40 + i * 60) % 360;
          const x = w * (0.5 + 0.42 * Math.sin(t * 0.5 + i * 1.7));
          const y = h * (0.5 + 0.4 * Math.cos(t * 0.6 + i * 2.3));
          const r = Math.max(w, h) * 0.55;
          const g = rc.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `hsla(${hue}, 95%, 60%, 0.75)`);
          g.addColorStop(1, `hsla(${hue}, 95%, 60%, 0)`);
          rc.fillStyle = g;
          rc.fillRect(0, 0, w, h);
        }
        // Twinkles
        for (let i = 0; i < 40; i++) {
          const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 12.9);
          rc.fillStyle = `rgba(255,255,255,${a * 0.8})`;
          const x = ((i * 0.6180339 + 0.07) % 1) * w;
          const y = ((i * 0.4142135 + 0.13) % 1) * h;
          rc.beginPath(); rc.arc(x, y, 1 + a * 1.5, 0, Math.PI * 2); rc.fill();
        }
        rc.globalCompositeOperation = "source-over";
      }

      const fx = fxRef.current?.getContext("2d");
      if (fx && w) {
        fx.setTransform(1, 0, 0, 1, 0, 0);
        fx.clearRect(0, 0, fx.canvas.width, fx.canvas.height);
        fx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Moving shine, clipped to the foil that is still there.
        if (!revealedRef.current && foilRef.current) {
          const p = ((t * 0.35) % 1.6) - 0.3;
          const sx = p * (w + h);
          const sheen = fx.createLinearGradient(sx - 120, 0, sx + 120, h);
          sheen.addColorStop(0, "rgba(255,255,255,0)");
          sheen.addColorStop(0.5, "rgba(255,255,255,0.22)");
          sheen.addColorStop(1, "rgba(255,255,255,0)");
          fx.fillStyle = sheen;
          fx.fillRect(0, 0, w, h);
          fx.globalCompositeOperation = "destination-in";
          fx.drawImage(foilRef.current, 0, 0, w, h);
          fx.globalCompositeOperation = "source-over";
        }
        fx.globalCompositeOperation = "lighter";
        particles.current = particles.current.filter(pt => {
          pt.life -= dt * 1.8;
          if (pt.life <= 0) return false;
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 260 * dt;
          fx.globalAlpha = pt.life;
          fx.fillStyle = pt.color;
          fx.beginPath(); fx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); fx.fill();
          return true;
        });
        fx.globalAlpha = 1;
        fx.globalCompositeOperation = "source-over";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const spark = (x: number, y: number, n: number, speed = 160) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random());
      particles.current.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.4, life: 1,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)], r: 1 + Math.random() * 2.2,
      });
    }
  };

  // Read coverage from a tiny copy of the foil: cheap enough to run while scratching.
  const measure = () => {
    const foil = foilRef.current;
    if (!foil) return;
    const probe = document.createElement("canvas");
    probe.width = 80; probe.height = 60;
    const pc = probe.getContext("2d")!;
    pc.drawImage(foil, 0, 0, 80, 60);
    const d = pc.getImageData(0, 0, 80, 60).data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 40) clear++;
    const pct = Math.round((clear / (80 * 60)) * 100);
    setPercent(pct);
    if (pct >= REVEAL_AT && !revealedRef.current) {
      revealedRef.current = true;
      setRevealed(true);
      const { w, h } = size.current;
      for (let i = 0; i < 6; i++) spark(w * (0.15 + i * 0.14), h * 0.6, 22, 380);
    }
  };

  const scratchTo = (x: number, y: number) => {
    const ctx = foilRef.current?.getContext("2d");
    if (!ctx) return;
    const { dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = brush;
    ctx.beginPath();
    const from = lastPos.current ?? { x, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    const dist = Math.hypot(x - from.x, y - from.y);
    spark(x, y, Math.min(6, 1 + Math.floor(dist / 6)));
    lastPos.current = { x, y };
    const now = performance.now();
    if (now - lastCheck.current > 220) { lastCheck.current = now; measure(); }
  };

  const local = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const moveCursor = (e: React.PointerEvent) => {
    const el = cursorRef.current;
    if (!el) return;
    const { x, y } = local(e);
    el.style.transform = `translate(${x - brush / 2}px, ${y - brush / 2}px)`;
    el.style.opacity = revealed || e.pointerType === "touch" ? "0" : "1";
  };

  const onDown = (e: React.PointerEvent) => {
    if (revealed) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPos.current = null;
    const p = local(e);
    scratchTo(p.x, p.y);
  };
  const onMove = (e: React.PointerEvent) => {
    moveCursor(e);
    if (!drawing.current || revealed) return;
    const p = local(e);
    scratchTo(p.x, p.y);
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPos.current = null;
    measure();
  };

  const reset = () => {
    revealedRef.current = false;
    setRevealed(false);
    setPercent(0);
    particles.current = [];
    setRound(r => r + 1);
    setup();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        ref={boxRef}
        className="relative w-[90vw] max-w-[600px] aspect-[4/3] rounded-2xl overflow-hidden touch-none select-none"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(168,85,247,0.15)", cursor: revealed ? "default" : "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => { if (cursorRef.current) cursorRef.current.style.opacity = "0"; }}
      >
        <canvas ref={rainbowRef} className="absolute inset-0 w-full h-full" />

        {/* Hidden message, animates in on reveal */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
          <p key={`t${round}`} className="font-display font-extrabold text-white text-3xl md:text-5xl tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
            {"YOU FOUND IT!".split("").map((ch, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  whiteSpace: "pre",
                  opacity: revealed ? 1 : 0.85,
                  animation: revealed ? `scratchLetter 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s both, scratchFloat 2.4s ease-in-out ${1 + i * 0.08}s infinite` : undefined,
                }}
              >{ch}</span>
            ))}
          </p>
          <p className="mt-3 px-3 py-1 rounded-full bg-black/35 backdrop-blur-sm text-white text-sm md:text-base font-semibold" style={{ opacity: revealed ? 1 : 0, transition: "opacity 0.8s ease 0.7s" }}>
            🌈 Rainbow treasure unlocked
          </p>
        </div>

        <canvas
          ref={foilRef}
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: revealed ? 0 : 1,
            transform: revealed ? "scale(1.08)" : "scale(1)",
            filter: revealed ? "blur(10px)" : "none",
            transition: "opacity 0.9s ease, transform 0.9s ease, filter 0.9s ease",
          }}
        />
        <canvas ref={fxRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Brush ring cursor */}
        <div
          ref={cursorRef}
          className="absolute top-0 left-0 rounded-full pointer-events-none border-2 border-white/80"
          style={{ width: brush, height: brush, opacity: 0, boxShadow: "0 0 12px rgba(255,255,255,0.5), inset 0 0 8px rgba(255,255,255,0.3)", transition: "opacity 0.2s, width 0.15s, height 0.15s" }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10">
          <span className="text-white/40">Revealed</span>
          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (percent / REVEAL_AT) * 100)}%`, background: "linear-gradient(90deg,#ff4d6d,#ffe14d,#4ade80,#38bdf8,#e879f9)", transition: "width 0.3s ease-out" }} />
          </div>
          <span className="text-white font-bold tabular-nums w-8 text-right">{revealed ? "100%" : `${percent}%`}</span>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10">
          <span className="text-white/40">Brush</span>
          <input type="range" min={14} max={70} value={brush} onChange={e => setBrush(Number(e.target.value))} className="w-20 h-1 accent-fuchsia-400 cursor-pointer" />
        </label>
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors">
          <RotateCcw size={12} /> {revealed ? "Scratch a new card" : "Reset"}
        </button>
      </div>

      <style>{`
        @keyframes scratchLetter { 0% { opacity: 0; transform: translateY(30px) scale(0.4) rotate(-15deg); } 100% { opacity: 1; transform: none; } }
        @keyframes scratchFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
};

export default RainbowScratch;
