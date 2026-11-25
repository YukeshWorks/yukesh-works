import { useState, useEffect, useRef, useCallback } from "react";
import { unlock } from "@/lib/siteEvents";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause, Play, Trophy, Zap } from "lucide-react";

/*
 * Snake, drawn on a canvas with a fixed-step game loop and per-frame interpolation,
 * so the snake glides between cells instead of jumping. Extras: eat bursts and
 * score pop-ups, golden bonus food on a timer, speed-up as you grow, a death
 * animation with screen shake, buffered turns, pause, a mobile D-pad and a saved best.
 */

const GRID = 20;
const START_STEP = 140;
const MIN_STEP = 68;
const BEST_KEY = "yw-snake-best";

type Dir = "up" | "down" | "left" | "right";
type P = { x: number; y: number };
type Status = "ready" | "playing" | "paused" | "dying" | "over";

const VEC: Record<Dir, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

const SAVAGE_MESSAGES = [
  "Bro really thought he was a snake charmer 🐍💀",
  "Even a worm has better reflexes than you 🪱",
  "Your snake died of embarrassment, not collision 😭",
  "That wall was literally standing still... and you LOST? 🧱",
  "Uninstall your fingers 🖐️🗑️",
  "My grandma plays better... and she's a plant 🌱",
  "You lasted shorter than my phone battery at 1% 🔋",
  "The food was RIGHT THERE. Right. There. 🍎",
  "Skill issue doesn't even begin to cover this 📉",
  "POV: you thought 'up' meant 'into the wall' 🤡",
  "The snake is filing a complaint against you 📝",
  "Are you playing with your elbows? Be honest 💀",
  "Achievement unlocked: Speedrun to Game Over! 🏆",
  "Your reaction time is measured in geological eras 🦕",
  "404: Skill not found 🚫",
  "The snake wanted to live, but YOU had other plans 💔",
];
const LOW_SCORE_ROASTS = [
  "Score: {score}. That's not a score, that's a cry for help 😭",
  "Score: {score}. My calculator shows more digits by accident 🧮",
];
const MID_SCORE_ROASTS = [
  "Score: {score}. Almost impressive... almost 🤏",
  "Score: {score}. You peaked and it wasn't high enough 📊",
];
const HIGH_SCORE_ROASTS = [
  "Score: {score}. Okay fine, that was actually decent. Don't let it go to your head 👀",
  "Score: {score}. Respect. Reluctantly. 🫡",
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const saveBest = (n: number) => { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* storage blocked */ } };

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; r: number };
type Popup = { x: number; y: number; text: string; life: number; color: string };

const SnakeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const [boardPx, setBoardPx] = useState(360);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [newBest, setNewBest] = useState(false);
  const [savageMsg, setSavageMsg] = useState("");
  const [scoreRoast, setScoreRoast] = useState("");

  // Mutable game state lives in a ref so the loop never waits on React.
  const g = useRef({
    snake: [] as P[],
    prev: [] as P[],
    dir: "right" as Dir,
    queue: [] as Dir[],
    food: { x: 14, y: 10 } as P,
    bonus: null as null | { p: P; until: number; born: number },
    eaten: 0,
    score: 0,
    step: START_STEP,
    acc: 0,
    status: "ready" as Status,
    particles: [] as Particle[],
    popups: [] as Popup[],
    deathAt: 0,
    eatPulse: 0,
  });

  const setStat = useCallback((s: Status) => { g.current.status = s; setStatus(s); }, []);

  // Fit the board to the screen.
  useEffect(() => {
    const fit = () => setBoardPx(Math.max(240, Math.min(420, window.innerWidth - 48, window.innerHeight - 330)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const freeCell = useCallback((avoid: P[]) => {
    let p: P;
    do { p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
    while (avoid.some(s => s.x === p.x && s.y === p.y));
    return p;
  }, []);

  const start = useCallback(() => {
    const s = g.current;
    s.snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 10 }];
    s.prev = s.snake.map(p => ({ ...p }));
    s.dir = "right"; s.queue = [];
    s.food = freeCell(s.snake);
    s.bonus = null; s.eaten = 0; s.score = 0; s.step = START_STEP; s.acc = 0;
    s.particles = []; s.popups = [];
    setScore(0); setNewBest(false);
    setStat("playing");
  }, [freeCell, setStat]);

  const turn = useCallback((d: Dir) => {
    const s = g.current;
    if (s.status === "ready" || s.status === "over") { start(); return; }
    if (s.status !== "playing") return;
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (d === last || d === OPPOSITE[last] || s.queue.length >= 2) return;
    s.queue.push(d);
  }, [start]);

  const togglePause = useCallback(() => {
    const s = g.current.status;
    if (s === "playing") setStat("paused");
    else if (s === "paused") setStat("playing");
  }, [setStat]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Keys typed into the command palette (or any field) are not game input.
      if (document.body.dataset.palette === "open" || (e.target instanceof HTMLElement && e.target.tagName === "INPUT")) return;
      const map: Record<string, Dir> = {
        ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
        ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
      };
      if (map[e.code]) { e.preventDefault(); turn(map[e.code]); return; }
      if (e.code === "Space") {
        e.preventDefault();
        const st = g.current.status;
        if (st === "ready" || st === "over") start(); else togglePause();
      }
      if (e.code === "KeyP" || e.code === "Escape") togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn, start, togglePause]);

  // Pause when the command palette opens.
  useEffect(() => {
    const onPalette = () => { if (g.current.status === "playing") setStat("paused"); };
    window.addEventListener("yw:palette-open", onPalette);
    return () => window.removeEventListener("yw:palette-open", onPalette);
  }, [setStat]);

  // Pause automatically when the tab is hidden.
  useEffect(() => {
    const onVis = () => { if (document.hidden && g.current.status === "playing") setStat("paused"); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setStat]);

  // Swipe
  const touch = useRef<P | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
      const st = g.current.status;
      if (st === "ready" || st === "over") start(); else togglePause();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? "right" : "left");
    else turn(dy > 0 ? "down" : "up");
  };

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = boardPx * dpr;
    canvas.height = boardPx * dpr;
    canvas.style.width = `${boardPx}px`;
    canvas.style.height = `${boardPx}px`;
    const C = boardPx / GRID;

    const burst = (cx: number, cy: number, color: string, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (40 + Math.random() * 120) * (C / 18);
        g.current.particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color, r: (1 + Math.random() * 2) * (C / 18) });
      }
    };

    const die = () => {
      const s = g.current;
      s.deathAt = performance.now();
      setStat("dying");
      const head = s.snake[0];
      burst((head.x + 0.5) * C, (head.y + 0.5) * C, "#f87171", 30);
      const el = shakeRef.current;
      if (el) {
        el.animate(
          [{ transform: "translate(0,0)" }, { transform: "translate(-8px,4px)" }, { transform: "translate(7px,-5px)" },
           { transform: "translate(-5px,-3px)" }, { transform: "translate(4px,3px)" }, { transform: "translate(0,0)" }],
          { duration: 420, easing: "ease-out" },
        );
      }
      const prevBest = readBest();
      if (s.score > prevBest) { saveBest(s.score); setBest(s.score); setNewBest(true); }
      setSavageMsg(pick(SAVAGE_MESSAGES));
      const roasts = s.score < 5 ? LOW_SCORE_ROASTS : s.score < 20 ? MID_SCORE_ROASTS : HIGH_SCORE_ROASTS;
      setScoreRoast(pick(roasts).replace("{score}", String(s.score)));
      window.setTimeout(() => { if (g.current.status === "dying") setStat("over"); }, 900);
    };

    const tick = (now: number) => {
      const s = g.current;
      if (s.queue.length) s.dir = s.queue.shift()!;
      const v = VEC[s.dir];
      const head = { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y };
      const willEat = head.x === s.food.x && head.y === s.food.y;
      const willBonus = s.bonus && head.x === s.bonus.p.x && head.y === s.bonus.p.y;
      const body = willEat || willBonus ? s.snake : s.snake.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || body.some(p => p.x === head.x && p.y === head.y)) {
        die();
        return;
      }
      s.prev = s.snake.map(p => ({ ...p }));
      s.snake = [head, ...s.snake];
      if (willEat || willBonus) {
        s.prev.push({ ...s.prev[s.prev.length - 1] });
        const pts = willBonus ? 5 : 1;
        s.score += pts;
        if (s.score >= 10) unlock("snake-10");
        s.eatPulse = 1;
        setScore(s.score);
        const cx = (head.x + 0.5) * C, cy = (head.y + 0.5) * C;
        burst(cx, cy, willBonus ? "#fde047" : "#fb7185", willBonus ? 26 : 14);
        s.popups.push({ x: cx, y: cy, text: `+${pts}`, life: 1, color: willBonus ? "#fde047" : "#fecdd3" });
        if (willBonus) s.bonus = null;
        if (willEat) {
          s.eaten++;
          s.food = freeCell(s.snake);
          s.step = Math.max(MIN_STEP, START_STEP - s.eaten * 3);
          if (s.eaten % 5 === 0 && !s.bonus) {
            s.bonus = { p: freeCell([...s.snake, s.food]), born: now, until: now + 5500 };
          }
        }
      } else {
        s.snake.pop();
      }
    };

    let last = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = g.current;

      if (s.status === "playing") {
        s.acc += dt * 1000;
        while (s.acc >= s.step && s.status === "playing") { s.acc -= s.step; tick(now); }
        if (s.bonus && now > s.bonus.until) s.bonus = null;
      }
      const alpha = s.status === "playing" ? Math.min(1, s.acc / s.step) : 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Board
      const bg = ctx.createLinearGradient(0, 0, boardPx, boardPx);
      bg.addColorStop(0, "#07090d");
      bg.addColorStop(1, "#0c0f16");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, boardPx, boardPx);
      ctx.fillStyle = "rgba(148, 163, 184, 0.09)";
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
        ctx.fillRect((x + 0.5) * C - 0.75, (y + 0.5) * C - 0.75, 1.5, 1.5);
      }

      // Food (pulsing apple with a halo)
      const t = now / 1000;
      const fx = (s.food.x + 0.5) * C, fy = (s.food.y + 0.5) * C;
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      const halo = ctx.createRadialGradient(fx, fy, 0, fx, fy, C * 1.4);
      halo.addColorStop(0, "rgba(251, 113, 133, 0.35)");
      halo.addColorStop(1, "rgba(251, 113, 133, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(fx - C * 1.5, fy - C * 1.5, C * 3, C * 3);
      const fg = ctx.createRadialGradient(fx - C * 0.12, fy - C * 0.15, 0, fx, fy, C * 0.42 * pulse);
      fg.addColorStop(0, "#fda4af");
      fg.addColorStop(1, "#e11d48");
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, fy, C * 0.38 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#4ade80"; ctx.lineWidth = Math.max(1.5, C * 0.1); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(fx, fy - C * 0.32); ctx.quadraticCurveTo(fx + C * 0.15, fy - C * 0.55, fx + C * 0.28, fy - C * 0.5); ctx.stroke();

      // Bonus food with a countdown ring
      if (s.bonus) {
        const bx = (s.bonus.p.x + 0.5) * C, by = (s.bonus.p.y + 0.5) * C;
        const left = (s.bonus.until - now) / (s.bonus.until - s.bonus.born);
        const blink = left < 0.3 ? (Math.sin(t * 20) > 0 ? 1 : 0.4) : 1;
        ctx.globalAlpha = blink;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(t * 2);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? C * 0.18 : C * 0.42;
          const a = (i / 10) * Math.PI * 2;
          ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "rgba(253, 224, 71, 0.7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, C * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Snake: interpolated centres joined into one smooth tube.
      if (s.snake.length) {
        const pts = s.snake.map((p, i) => {
          const q = s.prev[i] ?? p;
          return { x: (q.x + (p.x - q.x) * alpha + 0.5) * C, y: (q.y + (p.y - q.y) * alpha + 0.5) * C };
        });
        const dying = s.status === "dying" || s.status === "over";
        const deathT = dying ? Math.min(1, (now - s.deathAt) / 700) : 0;
        const n = pts.length;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let i = n - 1; i > 0; i--) {
          const k = i / Math.max(1, n - 1);
          const hue = 168 + k * 110;
          ctx.strokeStyle = dying ? `rgba(248, 113, 113, ${1 - deathT * 0.7})` : `hsl(${hue}, 85%, ${58 - k * 18}%)`;
          ctx.lineWidth = C * (0.78 - k * 0.32);
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i - 1].x, pts[i - 1].y); ctx.stroke();
        }
        // Head
        const h = pts[0];
        const v = VEC[s.dir];
        const headR = C * (0.46 + s.eatPulse * 0.12);
        ctx.shadowColor = dying ? "#f87171" : "#2dd4bf";
        ctx.shadowBlur = 14;
        ctx.fillStyle = dying ? "#f87171" : "#5eead4";
        ctx.beginPath(); ctx.arc(h.x, h.y, headR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Eyes look where it is going; X eyes when dead.
        const px = -v.y, py = v.x;
        for (const side of [-1, 1]) {
          const ex = h.x + v.x * C * 0.14 + px * side * C * 0.2;
          const ey = h.y + v.y * C * 0.14 + py * side * C * 0.2;
          if (dying) {
            ctx.strokeStyle = "#111"; ctx.lineWidth = 1.6;
            const r = C * 0.09;
            ctx.beginPath(); ctx.moveTo(ex - r, ey - r); ctx.lineTo(ex + r, ey + r); ctx.moveTo(ex + r, ey - r); ctx.lineTo(ex - r, ey + r); ctx.stroke();
          } else {
            ctx.fillStyle = "#0b1120";
            ctx.beginPath(); ctx.arc(ex, ey, C * 0.11, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(ex + v.x * C * 0.03, ey + v.y * C * 0.03, C * 0.04, 0, Math.PI * 2); ctx.fill();
          }
        }
        // Tongue flick
        if (!dying && Math.sin(t * 3) > 0.85) {
          ctx.strokeStyle = "#fb7185"; ctx.lineWidth = 1.5;
          const tx = h.x + v.x * headR, ty = h.y + v.y * headR;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + v.x * C * 0.3, ty + v.y * C * 0.3); ctx.stroke();
        }
      }
      s.eatPulse = Math.max(0, s.eatPulse - dt * 4);

      // Particles
      ctx.globalCompositeOperation = "lighter";
      s.particles = s.particles.filter(p => {
        p.life -= dt * 1.6;
        if (p.life <= 0) return false;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      ctx.globalCompositeOperation = "source-over";

      // Score pop-ups
      ctx.textAlign = "center";
      ctx.font = `800 ${Math.round(C * 0.8)}px Montserrat, sans-serif`;
      s.popups = s.popups.filter(p => {
        p.life -= dt * 1.4;
        if (p.life <= 0) return false;
        p.y -= dt * C * 2;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        return true;
      });
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [boardPx, freeCell, setStat]);

  const speedLevel = Math.min(10, 1 + Math.floor(score / 4));
  const dpad = (d: Dir, Icon: typeof ChevronUp, cls: string) => (
    <button
      type="button"
      aria-label={d}
      onClick={() => turn(d)}
      className={`${cls} w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 active:scale-90 active:bg-teal-400/20 transition-transform`}
    >
      <Icon size={22} />
    </button>
  );

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-36 md:pt-24 pb-10 page-transition">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f2a2a_0%,#05070a_55%)]" />
      <div className="absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-float-slow" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="text-center fade-in-up">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-white">Snake</span>
            <span className="ml-2 bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent">Glide</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Arrows / WASD / swipe · Space to start or pause · ★ = +5</p>
        </div>

        <div className="flex gap-2 text-xs fade-in-up delay-100" style={{ opacity: 0 }}>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10">
            <span className="text-white/40">Score </span>
            <span key={score} className="inline-block text-teal-300 font-bold tabular-nums" style={{ animation: "snakeBump 0.3s ease-out" }}>{score}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-1">
            <Trophy size={12} className="text-amber-300" />
            <span className="text-white/40">Best </span>
            <span className="text-amber-300 font-bold tabular-nums">{best}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-1">
            <Zap size={12} className="text-violet-300" />
            <span className="text-violet-300 font-bold tabular-nums">Lv {speedLevel}</span>
          </div>
          {(status === "playing" || status === "paused") && (
            <button type="button" onClick={togglePause} aria-label="Pause" className="px-2.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white">
              {status === "paused" ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
        </div>

        <div ref={shakeRef} className="fade-in-up delay-200" style={{ opacity: 0 }}>
          <div
            className="relative rounded-2xl p-[3px]"
            style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.6), rgba(139,92,246,0.5))", boxShadow: "0 0 40px rgba(45,212,191,0.15)" }}
          >
            <div
              className="relative rounded-[14px] overflow-hidden touch-none cursor-pointer"
              style={{ width: boardPx, height: boardPx }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onClick={() => { const st = g.current.status; if (st === "ready" || st === "over") start(); }}
            >
              <canvas ref={canvasRef} className="block" />

              {status !== "playing" && status !== "dying" && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ animation: "pageFadeIn 0.35s ease-out both" }}>
                  {status === "over" ? (
                    <>
                      <p className="font-display text-2xl font-extrabold text-rose-400" style={{ animation: "snakeSlam 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>💀 WASTED 💀</p>
                      {newBest && <p className="text-amber-300 text-xs font-bold tracking-widest uppercase" style={{ animation: "snakeBump 0.6s ease-out 0.3s both" }}>New best!</p>}
                      <p className="text-white text-xs font-medium max-w-[260px]">{savageMsg}</p>
                      <p className="text-white/50 text-[11px] italic max-w-[250px]">{scoreRoast}</p>
                      <p className="text-teal-300 text-xs mt-1 animate-pulse">Tap or Space to embarrass yourself again 🔄</p>
                    </>
                  ) : status === "paused" ? (
                    <>
                      <p className="font-display text-2xl font-extrabold text-white">Paused</p>
                      <p className="text-white/50 text-xs">Space / P / tap ▶ to continue</p>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl" style={{ animation: "snakeWiggle 1.6s ease-in-out infinite" }}>🐍</div>
                      <p className="font-display text-xl font-bold text-teal-300">Tap to start</p>
                      <p className="text-white/40 text-xs">Eat 🍎 to grow · every 5th apple drops a ★</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile D-pad */}
        <div className="md:hidden grid grid-cols-3 gap-2 mt-1 fade-in-up delay-300" style={{ opacity: 0 }}>
          <div />{dpad("up", ChevronUp, "")}<div />
          {dpad("left", ChevronLeft, "")}
          <div className="w-14 h-14" />
          {dpad("right", ChevronRight, "")}
          <div />{dpad("down", ChevronDown, "")}<div />
        </div>
      </div>

      <style>{`
        @keyframes snakeBump { 0% { transform: scale(1.5); color: #fff; } 100% { transform: scale(1); } }
        @keyframes snakeSlam { 0% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes snakeWiggle { 0%,100% { transform: rotate(-8deg) translateY(0); } 50% { transform: rotate(8deg) translateY(-6px); } }
      `}</style>
    </section>
  );
};

export default SnakeGame;
