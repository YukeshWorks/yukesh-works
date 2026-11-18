import { useRef, useEffect, useState, useCallback } from "react";
import { Brush, Download, Eraser, Hand, Moon, RotateCcw, Sticker, Sun } from "lucide-react";

/*
 * Island Creator: a living scene (sky, sun or moon, drifting clouds, moving waves,
 * foam around the island, stars at night) under a paint layer and placeable items.
 * Every item type has its own idle motion; items pop in with a ripple, can be dragged
 * in Move mode, poof away in Erase mode, and the island can be saved as a PNG.
 */

type Motion = "sway" | "bob" | "swim" | "scuttle" | "spin" | "pulse" | "jump" | "drift" | "none";

const ISLAND_ITEMS: { emoji: string; label: string; motion: Motion }[] = [
  { emoji: "🌴", label: "Palm tree", motion: "sway" },
  { emoji: "🏠", label: "House", motion: "none" },
  { emoji: "🌺", label: "Flower", motion: "pulse" },
  { emoji: "⛵", label: "Boat", motion: "bob" },
  { emoji: "🐬", label: "Dolphin", motion: "jump" },
  { emoji: "🐠", label: "Fish", motion: "swim" },
  { emoji: "🦀", label: "Crab", motion: "scuttle" },
  { emoji: "🐚", label: "Shell", motion: "none" },
  { emoji: "🌊", label: "Wave", motion: "bob" },
  { emoji: "☀️", label: "Sun", motion: "spin" },
  { emoji: "☁️", label: "Cloud", motion: "drift" },
  { emoji: "🦜", label: "Parrot", motion: "pulse" },
];
const MOTION = Object.fromEntries(ISLAND_ITEMS.map(i => [i.emoji, i.motion])) as Record<string, Motion>;
const COLORS = ["#38bdf8", "#facc15", "#fb7185", "#4ade80", "#f472b6", "#a78bfa", "#ffffff", "#0f172a"];

interface PlacedItem { id: number; emoji: string; x: number; y: number; size: number; rotation: number; delay: number; leaving?: boolean }
type Mode = "draw" | "place" | "move" | "erase";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (c1: number[], c2: number[], t: number) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(",")})`;

const IslandCreator = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef<HTMLCanvasElement>(null);
  const dims = useRef({ w: 0, h: 0, dpr: 1 });
  const night = useRef(0); // 0 day → 1 night, tweened
  const [isNight, setIsNight] = useState(false);
  const [selected, setSelected] = useState("🌴");
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [brush, setBrush] = useState(5);
  const [mode, setMode] = useState<Mode>("place");
  const nextId = useRef(1);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const isNightRef = useRef(false);
  isNightRef.current = isNight;

  const sizeCanvases = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const w = box.clientWidth, h = box.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const old = dims.current;
    // Keep the drawing when the box resizes.
    let snapshot: HTMLCanvasElement | null = null;
    const paint = paintRef.current;
    if (paint && old.w) {
      snapshot = document.createElement("canvas");
      snapshot.width = paint.width; snapshot.height = paint.height;
      snapshot.getContext("2d")!.drawImage(paint, 0, 0);
    }
    dims.current = { w, h, dpr };
    for (const c of [sceneRef.current, paintRef.current]) {
      if (!c) continue;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    if (snapshot && paint) paint.getContext("2d")!.drawImage(snapshot, 0, 0, paint.width, paint.height);
  }, []);

  useEffect(() => {
    sizeCanvases();
    const ro = new ResizeObserver(sizeCanvases);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [sizeCanvases]);

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number, n: number) => {
    const horizon = h * 0.36;
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, mix([125, 211, 252], [8, 12, 35], n));
    sky.addColorStop(1, mix([254, 215, 170], [30, 27, 75], n));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon + 1);

    // Stars
    if (n > 0.05) {
      for (let i = 0; i < 50; i++) {
        // Hash-based scatter (a plain golden-ratio step lines the stars up diagonally).
        const hx = Math.sin(i * 127.1) * 43758.5453, hy = Math.sin(i * 311.7) * 24634.6345;
        const x = (hx - Math.floor(hx)) * w;
        const y = (hy - Math.floor(hy)) * horizon * 0.9;
        const a = n * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
    }

    // Sun sets as the moon rises
    const sunY = lerp(horizon * 0.35, horizon + 40, n);
    const sx = w * 0.82;
    const glow = ctx.createRadialGradient(sx, sunY, 0, sx, sunY, 70);
    glow.addColorStop(0, `rgba(253, 224, 71, ${0.55 * (1 - n)})`);
    glow.addColorStop(1, "rgba(253, 224, 71, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 80, sunY - 80, 160, 160);
    ctx.fillStyle = `rgba(253, 230, 138, ${1 - n})`;
    ctx.beginPath(); ctx.arc(sx, sunY, 22, 0, Math.PI * 2); ctx.fill();
    const moonY = lerp(horizon + 40, horizon * 0.3, n);
    const mx = w * 0.18;
    ctx.fillStyle = `rgba(241, 245, 249, ${n})`;
    ctx.beginPath(); ctx.arc(mx, moonY, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix([254, 215, 170], [22, 22, 60], n);
    ctx.beginPath(); ctx.arc(mx + 7, moonY - 4, 14, 0, Math.PI * 2); ctx.fill();

    // Clouds
    for (let i = 0; i < 4; i++) {
      const cx = ((t * (6 + i * 3) + i * 230) % (w + 200)) - 100;
      const cy = horizon * (0.25 + i * 0.15);
      // One path per cloud so overlapping puffs don't stack into darker blotches.
      ctx.fillStyle = mix([255, 255, 255], [70, 72, 110], n);
      ctx.globalAlpha = lerp(0.85, 0.55, n);
      ctx.beginPath();
      for (const [ox, oy, r] of [[0, 0, 16], [18, -7, 20], [38, 0, 15], [20, 5, 16]]) {
        const rr = r * (0.7 + i * 0.1);
        ctx.moveTo(cx + ox + rr, cy + oy);
        ctx.arc(cx + ox, cy + oy, rr, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ocean
    const sea = ctx.createLinearGradient(0, horizon, 0, h);
    sea.addColorStop(0, mix([14, 165, 233], [12, 30, 70], n));
    sea.addColorStop(1, mix([3, 105, 161], [4, 12, 32], n));
    ctx.fillStyle = sea;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Moving wave lines
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 9; row++) {
      const y = horizon + 10 + row * ((h - horizon) / 9);
      const amp = 2 + row * 0.5;
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + row * 0.012})`;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin(x * 0.03 + t * (1 + row * 0.15) + row) * amp;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // Sun / moon glitter path
    const gx = lerp(sx, mx, n);
    for (let i = 0; i < 26; i++) {
      const y = horizon + 6 + i * ((h - horizon) / 26);
      const spread = 8 + i * 2.2;
      const x = gx + Math.sin(t * 3 + i * 1.7) * spread;
      ctx.fillStyle = `rgba(255, 244, 214, ${0.35 * (1 - i / 26)})`;
      ctx.fillRect(x - 6, y, 12 - i * 0.3, 1.5);
    }

    // Island
    const island = () => {
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.68);
      ctx.bezierCurveTo(w * 0.24, h * 0.44, w * 0.42, h * 0.38, w * 0.5, h * 0.42);
      ctx.bezierCurveTo(w * 0.58, h * 0.38, w * 0.77, h * 0.44, w * 0.8, h * 0.68);
      ctx.bezierCurveTo(w * 0.7, h * 0.76, w * 0.3, h * 0.76, w * 0.2, h * 0.68);
      ctx.closePath();
    };
    // Foam ring breathing around the shore
    ctx.save();
    island();
    ctx.lineWidth = 10 + Math.sin(t * 1.6) * 4;
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 1.6) * 0.1})`;
    ctx.stroke();
    ctx.restore();
    // Sand
    island();
    ctx.fillStyle = mix([253, 224, 160], [120, 105, 80], n);
    ctx.fill();
    // Grass
    ctx.save();
    ctx.translate(w * 0.5, h * 0.565);
    ctx.scale(0.82, 0.74);
    ctx.translate(-w * 0.5, -h * 0.565);
    island();
    const grass = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.55, w * 0.3);
    grass.addColorStop(0, mix([74, 222, 128], [22, 70, 45], n));
    grass.addColorStop(1, mix([22, 163, 74], [12, 45, 30], n));
    ctx.fillStyle = grass;
    ctx.fill();
    ctx.restore();
  }, []);

  // Scene animation loop
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let prev = start;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const target = isNightRef.current ? 1 : 0;
      night.current += (target - night.current) * Math.min(1, dt * 2.2);
      const ctx = sceneRef.current?.getContext("2d");
      const { w, h, dpr } = dims.current;
      if (ctx && w) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, w, h, (now - start) / 1000, night.current);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [drawScene]);

  const local = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, leaving: true } : i)));
    window.setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 380);
  };

  const onDown = (e: React.PointerEvent) => {
    const p = local(e);
    if (mode === "place") {
      const id = nextId.current++;
      setItems(prev => [...prev, { id, emoji: selected, x: p.x, y: p.y, size: 30 + Math.random() * 8, rotation: Math.random() * 14 - 7, delay: Math.random() * 2 }]);
      setRipples(prev => [...prev, { id, x: p.x, y: p.y }]);
      window.setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
      return;
    }
    if (mode === "erase") {
      const hit = [...items].reverse().find(i => !i.leaving && Math.hypot(i.x - p.x, i.y - p.y) < i.size * 0.6);
      if (hit) { removeItem(hit.id); return; }
    }
    if (mode === "move") {
      const hit = [...items].reverse().find(i => Math.hypot(i.x - p.x, i.y - p.y) < i.size * 0.7);
      if (hit) {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragging.current = { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y };
      }
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = p;
    stroke(p);
  };

  const stroke = (p: { x: number; y: number }) => {
    const ctx = paintRef.current?.getContext("2d");
    if (!ctx) return;
    const { dpr } = dims.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = mode === "erase" ? brush * 3 : brush;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const from = last.current ?? p;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
    last.current = p;
  };

  const onMove = (e: React.PointerEvent) => {
    const p = local(e);
    if (dragging.current) {
      const d = dragging.current;
      setItems(prev => prev.map(i => (i.id === d.id ? { ...i, x: p.x + d.dx, y: p.y + d.dy } : i)));
      return;
    }
    if (drawing.current) stroke(p);
  };
  const onUp = () => { drawing.current = false; last.current = null; dragging.current = null; };

  const reset = () => {
    items.forEach(i => removeItem(i.id));
    const c = paintRef.current;
    if (c) {
      c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350 }).onfinish = () => c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    }
  };

  const save = () => {
    const { w, h, dpr } = dims.current;
    const out = document.createElement("canvas");
    out.width = w * dpr; out.height = h * dpr;
    const ctx = out.getContext("2d")!;
    if (sceneRef.current) ctx.drawImage(sceneRef.current, 0, 0);
    if (paintRef.current) ctx.drawImage(paintRef.current, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const i of items) {
      ctx.save(); ctx.translate(i.x, i.y); ctx.rotate((i.rotation * Math.PI) / 180);
      ctx.font = `${i.size}px serif`; ctx.fillText(i.emoji, 0, 0); ctx.restore();
    }
    const a = document.createElement("a");
    a.download = "my-island.png";
    a.href = out.toDataURL("image/png");
    a.click();
  };

  const modeBtn = (m: Mode, Icon: typeof Brush, label: string) => (
    <button
      key={m}
      type="button"
      onClick={() => setMode(m)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${mode === m ? "bg-sky-400/20 text-sky-200 shadow-[0_0_14px_rgba(56,189,248,0.25)]" : "text-white/50 hover:text-white"}`}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-36 md:pt-24 pb-10 page-transition">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0c3b52_0%,#04080d_60%)]" />

      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-2xl px-4">
        <div className="text-center fade-in-up">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-white">Island</span>
            <span className="ml-2 bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">Creator</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Place, paint, drag things around. Everything comes alive.</p>
        </div>

        <div
          ref={boxRef}
          className="relative w-[92vw] max-w-[620px] aspect-[4/3] rounded-2xl overflow-hidden touch-none select-none fade-in-up delay-100"
          style={{
            opacity: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(56,189,248,0.15)",
            cursor: mode === "place" ? "copy" : mode === "move" ? "grab" : mode === "erase" ? "not-allowed" : "crosshair",
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <canvas ref={sceneRef} className="absolute inset-0 w-full h-full" />
          <canvas ref={paintRef} className="absolute inset-0 w-full h-full" />

          {ripples.map(r => (
            <span key={r.id} className="absolute rounded-full border-2 border-white/70 pointer-events-none"
              style={{ left: r.x - 20, top: r.y - 8, width: 40, height: 16, animation: "islandRipple 0.7s ease-out both" }} />
          ))}

          {items.map(item => (
            <div
              key={item.id}
              className="absolute pointer-events-none leading-none"
              style={{
                left: item.x, top: item.y, fontSize: item.size,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                filter: isNight ? "drop-shadow(0 3px 4px rgba(0,0,0,0.6)) brightness(0.75)" : "drop-shadow(0 3px 4px rgba(0,0,0,0.35))",
                transition: "filter 1s ease",
              }}
            >
              <div style={{ animation: item.leaving ? "islandPoof 0.38s ease-in both" : "islandPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <div className={`island-${MOTION[item.emoji] ?? "none"}`} style={{ animationDelay: `${-item.delay}s` }}>{item.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-center items-center gap-2 fade-in-up delay-200" style={{ opacity: 0 }}>
          <div className="rounded-lg p-1 flex gap-1 bg-white/[0.05] border border-white/10">
            {modeBtn("place", Sticker, "Place")}
            {modeBtn("draw", Brush, "Paint")}
            {modeBtn("move", Hand, "Move")}
            {modeBtn("erase", Eraser, "Erase")}
          </div>
          <button type="button" onClick={() => setIsNight(n => !n)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-white/[0.05] border border-white/10 text-white/70 hover:text-white">
            {isNight ? <Sun size={13} className="text-amber-300" /> : <Moon size={13} className="text-indigo-300" />} {isNight ? "Day" : "Night"}
          </button>
          <button type="button" onClick={save} title="Save as image" className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white"><Download size={14} /></button>
          <button type="button" onClick={reset} title="Clear" className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white"><RotateCcw size={14} /></button>
        </div>

        <div className="min-h-[44px] flex items-center justify-center">
          {mode === "place" && (
            <div key="place" className="rounded-lg p-1.5 flex flex-wrap justify-center gap-1 bg-white/[0.05] border border-white/10" style={{ animation: "pageFadeIn 0.3s ease-out both" }}>
              {ISLAND_ITEMS.map(item => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setSelected(item.emoji)}
                  title={item.label}
                  className={`text-xl w-9 h-9 rounded-md transition-all duration-200 ${selected === item.emoji ? "bg-sky-400/25 scale-110 shadow-[0_0_14px_rgba(56,189,248,0.3)]" : "hover:bg-white/10 hover:scale-110"}`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          )}
          {(mode === "draw" || mode === "erase") && (
            <div key="paint" className="flex flex-wrap justify-center items-center gap-2" style={{ animation: "pageFadeIn 0.3s ease-out both" }}>
              {mode === "draw" && (
                <div className="rounded-lg p-1.5 flex gap-1.5 bg-white/[0.05] border border-white/10">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Colour ${c}`}
                      className={`w-6 h-6 rounded-full border border-white/20 transition-transform duration-200 ${color === c ? "scale-125 ring-2 ring-sky-300" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
              <label className="rounded-lg px-3 py-2 flex items-center gap-2 text-xs bg-white/[0.05] border border-white/10 text-white/50">
                {mode === "erase" ? "Eraser" : "Brush"}
                <input type="range" min={1} max={16} value={brush} onChange={e => setBrush(Number(e.target.value))} className="w-20 h-1 accent-sky-400 cursor-pointer" />
              </label>
              {mode === "erase" && <span className="text-[11px] text-white/40">Tap an item to remove it, drag to erase paint</span>}
            </div>
          )}
          {mode === "move" && <p className="text-[11px] text-white/40">Drag any item to move it</p>}
        </div>
      </div>

      <style>{`
        @keyframes islandPop { 0% { opacity: 0; transform: scale(0) translateY(10px); } 100% { opacity: 1; transform: none; } }
        @keyframes islandPoof { 0% { opacity: 1; transform: scale(1); filter: blur(0); } 100% { opacity: 0; transform: scale(1.6); filter: blur(6px); } }
        @keyframes islandRipple { 0% { opacity: 0.9; transform: scale(0.3); } 100% { opacity: 0; transform: scale(2.2); } }
        .island-sway { transform-origin: 50% 95%; animation: islandSway 3.2s ease-in-out infinite; }
        .island-bob { animation: islandBob 2.6s ease-in-out infinite; }
        .island-swim { animation: islandSwim 6s ease-in-out infinite; }
        .island-scuttle { animation: islandScuttle 2.4s steps(12) infinite; }
        .island-spin { animation: islandSpin 14s linear infinite; }
        .island-pulse { animation: islandPulse 2.4s ease-in-out infinite; }
        .island-jump { animation: islandJump 3.6s ease-in-out infinite; }
        .island-drift { animation: islandDrift 9s ease-in-out infinite; }
        @keyframes islandSway { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
        @keyframes islandBob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-5px) rotate(4deg); } }
        @keyframes islandSwim { 0% { transform: translateX(-18px) scaleX(-1); } 45% { transform: translateX(18px) scaleX(-1); } 50% { transform: translateX(18px) scaleX(1); } 95% { transform: translateX(-18px) scaleX(1); } 100% { transform: translateX(-18px) scaleX(-1); } }
        @keyframes islandScuttle { 0%,100% { transform: translateX(-8px); } 50% { transform: translateX(8px); } }
        @keyframes islandSpin { to { transform: rotate(360deg); } }
        @keyframes islandPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes islandJump { 0%,55%,100% { transform: translate(0,0) rotate(0); } 70% { transform: translate(10px,-22px) rotate(-25deg); } 85% { transform: translate(20px,0) rotate(20deg); } }
        @keyframes islandDrift { 0%,100% { transform: translateX(-14px); } 50% { transform: translateX(14px); } }
        @media (prefers-reduced-motion: reduce) { [class^="island-"] { animation: none !important; } }
      `}</style>
    </section>
  );
};

export default IslandCreator;
