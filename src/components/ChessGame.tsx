import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, Bot, Crown, Lightbulb, RotateCcw, Undo2, Users, Volume2, VolumeX } from "lucide-react";
import {
  START_FEN, MATE_SCORE, VALUE, attackersOf, evaluate, findKing, inCheck, legalMoves, makeMove, other, outcome, parseFEN,
  positionKey, searchBestMove, toSAN,
  type Color, type Level, type Move, type Outcome, type Piece, type PieceType, type SearchResult, type State,
} from "@/lib/chess";
import { ChessDefs, PieceSvg } from "./chessPieces";
import { unlock } from "@/lib/siteEvents";

/*
 * Chess Arena. Animation map:
 *  - entrance: board swoops in, squares ripple in a diagonal wave, pieces drop with dust
 *  - moves: pieces arc through the air (knights hop and twist) and squash on landing
 *  - captures: the victim shatters into shards with sparks and a shockwave; big ones shake the board
 *  - check: slam banner + pulsing king square; checkmate: spotlight, king topples and shatters,
 *    winners do a wave, fireworks if you won
 *  - promotion: a beam of light and a morph; flip: the board spins while pieces stay upright
 *  - new game: survivors glide home; undo: captured pieces rematerialise
 *  - computer: a scan line while thinking, and the chosen piece glows before it moves
 */

type Snapshot = { state: State; move: Move | null; san: string; key: string };
type Mode = "ai" | "local";
type Ghost = { key: string; piece: Piece; v: number; delay: number; fade?: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; rot: number; vr: number; color: string; kind: "shard" | "spark" | "ring" | "dust"; g: number };
type SoundKind = "move" | "capture" | "castle" | "check" | "promote" | "win" | "lose" | "draw" | "select" | "whoosh" | "thud"
  | "boom" | "heartbeat" | "charge" | "zap" | "impact" | "crack" | "crown" | "choir" | "soul";
type Pt = { x: number; y: number };
type Soul = { key: string; x0: number; y0: number; x1: number; y1: number; color: string };
/** The checkmate cutscene. phase: 1 freeze · 2 title · 3 charge · 4 strike · 5 impact · 6 aftermath · 7 done */
type Cine = {
  phase: number;
  winner: Color;
  atkId: number; atkT: PieceType; atkC: Color;
  kingId: number;
  aV: number; kV: number;
  path: Pt[];
  cam: { s: number; tx: number; ty: number };
  crown: boolean;
  kingGone: boolean;
  fallen: Record<number, { dir: number; delay: number }> | null;
  san: string;
  bolts: string[];
};

const FINISHERS: Record<PieceType, { name: string; tagline: string; glow: string }> = {
  q: { name: "Royal Judgement", tagline: "The queen passes sentence.", glow: "250, 204, 21" },
  r: { name: "Siege Breaker", tagline: "The tower comes down on the throne.", glow: "248, 113, 113" },
  b: { name: "Holy Lance", tagline: "Pierced by a single ray of light.", glow: "125, 211, 252" },
  n: { name: "Cavalry Charge", tagline: "Out of nowhere, hooves of thunder.", glow: "163, 230, 53" },
  p: { name: "Pawn's Revenge", tagline: "The smallest soldier topples the crown.", glow: "232, 121, 249" },
  k: { name: "Regicide", tagline: "", glow: "255, 255, 255" },
};
const PIECE_NAME: Record<PieceType, string> = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" };

/** Points (in board units, visual orientation) from one square to another; knights take their L. */
const pathPoints = (a: number, b: number, t: PieceType): Pt[] => {
  const ax = (a & 7) + 0.5, ay = (a >> 3) + 0.5, bx = (b & 7) + 0.5, by = (b >> 3) + 0.5;
  if (t !== "n") return [{ x: ax, y: ay }, { x: bx, y: by }];
  return Math.abs(bx - ax) > Math.abs(by - ay)
    ? [{ x: ax, y: ay }, { x: bx, y: ay }, { x: bx, y: by }]
    : [{ x: ax, y: ay }, { x: ax, y: by }, { x: bx, y: by }];
};
const ptsAttr = (pts: Pt[]) => pts.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
const pathLen = (pts: Pt[]) => pts.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
/** A jagged lightning polyline along a path. */
const boltAlong = (pts: Pt[], jag: number) => {
  const out: Pt[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(4, Math.round(Math.hypot(b.x - a.x, b.y - a.y) * 4));
    const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
    for (let k = 0; k <= n; k++) {
      const t = k / n, off = k === 0 || k === n ? 0 : (Math.random() * 2 - 1) * jag;
      out.push({ x: a.x + (b.x - a.x) * t + (nx / nl) * off, y: a.y + (b.y - a.y) * t + (ny / nl) * off });
    }
  }
  return ptsAttr(out);
};
const CRACKS = ["M50 18 L46 34 L55 44 L44 58 L52 72 L47 84", "M46 34 L33 41 L28 52", "M55 44 L67 50 L71 62", "M44 58 L35 66", "M52 72 L62 78"];

const CrownSvg = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
    <defs>
      <linearGradient id="chess-crown-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3b0" /><stop offset="0.5" stopColor="#f5c542" /><stop offset="1" stopColor="#b7791f" />
      </linearGradient>
    </defs>
    <path d="M14 72 L19 30 L37 52 L50 20 L63 52 L81 30 L86 72 Z" fill="url(#chess-crown-g)" stroke="#6b4206" strokeWidth="3" strokeLinejoin="round" />
    <rect x="13" y="70" width="74" height="13" rx="3" fill="url(#chess-crown-g)" stroke="#6b4206" strokeWidth="3" />
    {[[19, 28], [50, 17], [81, 28]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill="#fff8d6" stroke="#6b4206" strokeWidth="2.5" />)}
    <circle cx="50" cy="77" r="4" fill="#e11d48" /><circle cx="32" cy="77" r="3" fill="#2563eb" /><circle cx="68" cy="77" r="3" fill="#16a34a" />
  </svg>
);

const LEVEL_LABEL: Record<Level, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const TAU = Math.PI * 2;
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const freshSnap = (): Snapshot => { const s = parseFEN(START_FEN); return { state: s, move: null, san: "", key: positionKey(s) }; };
const flightMs = (a: number, b: number, knight: boolean) =>
  Math.round(Math.min(560, 300 + Math.hypot((b & 7) - (a & 7), (b >> 3) - (a >> 3)) * 35) + (knight ? 60 : 0));

/* ---------- Sound (Web Audio, no files) ---------- */
const useSound = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const on = useRef(true);
  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    void ctxRef.current?.resume?.();
  }, []);
  const play = useCallback((kind: SoundKind, delayMs = 0) => {
    const ctx = ctxRef.current;
    if (!on.current || !ctx) return;
    const t0 = ctx.currentTime + delayMs / 1000;
    const tone = (f: number, dur: number, type: OscillatorType, vol: number, at = 0, to?: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0 + at);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + at + dur);
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g).connect(ctx.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
    };
    const noise = (dur: number, vol: number, at = 0, freq = 1200) => {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = "lowpass"; f.frequency.value = freq; g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination); src.start(t0 + at);
    };
    switch (kind) {
      case "move": noise(0.07, 0.5, 0, 900); tone(190, 0.08, "sine", 0.18); break;
      case "capture": noise(0.16, 0.8, 0, 2400); tone(130, 0.18, "triangle", 0.25); noise(0.05, 0.35, 0.03, 6000); break;
      case "castle": noise(0.07, 0.5, 0, 900); tone(190, 0.08, "sine", 0.16); noise(0.07, 0.5, 0.12, 900); tone(220, 0.08, "sine", 0.16, 0.12); break;
      case "check": tone(880, 0.12, "triangle", 0.12); tone(660, 0.18, "triangle", 0.12, 0.13); break;
      case "promote": [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "sine", 0.1, i * 0.07)); break;
      case "win": [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.35, "triangle", 0.11, i * 0.12)); break;
      case "lose": [392, 349, 311, 262].forEach((f, i) => tone(f, 0.4, "sine", 0.1, i * 0.18)); break;
      case "draw": tone(440, 0.4, "sine", 0.08); tone(440 * 1.25, 0.5, "sine", 0.07, 0.15); break;
      case "select": tone(1400, 0.04, "sine", 0.05); break;
      case "whoosh": noise(0.5, 0.25, 0, 500); break;
      case "thud": noise(0.25, 0.9, 0, 300); tone(70, 0.3, "sine", 0.3); break;
      case "boom": tone(52, 1.4, "sine", 0.4, 0, 38); noise(0.7, 0.55, 0, 180); break;
      case "heartbeat": tone(62, 0.16, "sine", 0.4); tone(55, 0.2, "sine", 0.32, 0.22); break;
      case "charge": tone(110, 0.9, "sawtooth", 0.035, 0, 880); tone(220, 0.9, "triangle", 0.05, 0, 1320); noise(0.9, 0.12, 0, 3500); break;
      case "zap": for (let i = 0; i < 6; i++) noise(0.05, 0.55, i * 0.055, 6500); tone(1800, 0.3, "square", 0.02, 0, 300); break;
      case "impact": noise(0.7, 1, 0, 1600); tone(48, 0.9, "sine", 0.5, 0, 30); noise(0.1, 0.6, 0.02, 9000); break;
      case "crack": noise(0.07, 0.6, 0, 9000); noise(0.06, 0.5, 0.08, 7000); noise(0.05, 0.4, 0.15, 8000); break;
      case "crown": tone(2637, 0.35, "sine", 0.07); tone(3951, 0.25, "sine", 0.035); tone(1975, 0.4, "triangle", 0.03); break;
      case "soul": tone(1200, 0.25, "sine", 0.04, 0, 2400); break;
      case "choir": [220, 277.2, 329.6, 440, 554.4].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i % 2 ? "triangle" : "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.045, t0 + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
        o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 2.7);
      }); break;
    }
  }, []);
  useEffect(() => () => { void ctxRef.current?.close(); }, []);
  return { ensure, play, on };
};

/* ---------- Full-screen fireworks for a win ---------- */
const Fireworks = ({ run }: { run: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  // The full-screen canvas only exists while a show is playing; an idle one still costs compositing.
  const [live, setLive] = useState(false);
  useEffect(() => { if (run && !reduceMotion()) setLive(true); }, [run]);
  useEffect(() => {
    if (!live) return;
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    type P = { x: number; y: number; vx: number; vy: number; life: number; color: string; rocket?: boolean };
    const colors = ["#fde68a", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#c084fc", "#ffffff"];
    let parts: P[] = [];
    const start = performance.now();
    let last = start, lastLaunch = 0, raf = 0;
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (t - start < 4200 && t - lastLaunch > 300) {
        lastLaunch = t;
        const h = H * (0.35 + Math.random() * 0.35);
        parts.push({ x: W * (0.15 + Math.random() * 0.7), y: H, vx: (Math.random() - 0.5) * 80, vy: -Math.sqrt(2 * 420 * h), life: 1, color: colors[Math.floor(Math.random() * colors.length)], rocket: true });
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const next: P[] = [];
      for (const p of parts) {
        p.vy += (p.rocket ? 420 : 140) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.rocket) {
          if (p.vy > -30) {
            const n = 70;
            for (let i = 0; i < n; i++) {
              const a = (i / n) * TAU, sp = 90 + Math.random() * 170;
              next.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color: Math.random() < 0.2 ? "#ffffff" : p.color });
            }
            continue;
          }
          ctx.fillStyle = "#fff8e1"; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
          next.push(p);
          continue;
        }
        p.vx *= 1 - 1.2 * dt; p.vy *= 1 - 1.2 * dt;
        p.life -= dt * 0.65;
        if (p.life <= 0) continue;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.4, p.y - 1.4, 2.8, 2.8);
        next.push(p);
      }
      ctx.globalAlpha = 1;
      parts = next;
      if (parts.length || t - start < 4200) raf = requestAnimationFrame(frame);
      else setLive(false);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live, run]);
  return live ? <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none z-[80]" aria-hidden="true" /> : null;
};

const Seg = <T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string; icon?: typeof Bot }[]; onChange: (v: T) => void }) => (
  <div className="grid gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
    {options.map(o => (
      <button
        key={o.v}
        type="button"
        onClick={() => onChange(o.v)}
        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${value === o.v ? "bg-amber-300/15 text-amber-200 shadow-[inset_0_0_0_1px_rgba(245,200,107,0.35)]" : "text-white/50 hover:text-white"}`}
      >
        {o.icon && <o.icon size={13} />}{o.label}
      </button>
    ))}
  </div>
);

const ChessGame = () => {
  const [mode, setMode] = useState<Mode>("ai");
  const [level, setLevel] = useState<Level>("medium");
  const [playerColor, setPlayerColor] = useState<Color>("w");
  const [orientation, setOrientation] = useState<Color>("w");
  const [hist, setHist] = useState<Snapshot[]>(() => [freshSnap()]);
  const [selected, setSelected] = useState<number | null>(null);
  const [promo, setPromo] = useState<{ from: number; to: number; dragged: boolean } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [aiIntent, setAiIntent] = useState<number | null>(null);
  const [aiInfo, setAiInfo] = useState<{ depth: number; nodes: number } | null>(null);
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [banner, setBanner] = useState<number | null>(null);
  const [beam, setBeam] = useState<number | null>(null);
  const [over, setOver] = useState<Outcome | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [fireworks, setFireworks] = useState(0);
  const [evalScore, setEvalScore] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [intro, setIntro] = useState(true);
  const [boardPx, setBoardPx] = useState(480);
  const [dragSq, setDragSq] = useState<number | null>(null);
  const [cine, setCine] = useState<Cine | null>(null);
  const [souls, setSouls] = useState<Soul[]>([]);
  const cameraRef = useRef<HTMLDivElement>(null);
  const trayRefs = useRef<Record<Color, HTMLDivElement | null>>({ w: null, b: null });

  const snap = hist[hist.length - 1];
  const s = snap.state;
  const stateRef = useRef(s);
  stateRef.current = s;
  const vOf = useCallback((sq: number) => (orientation === "w" ? sq : 63 - sq), [orientation]);

  const { ensure, play, on: soundRef } = useSound();
  soundRef.current = soundOn;

  const legal = useMemo(() => legalMoves(s), [s]);
  const outcomeNow = useMemo(() => outcome(s, hist.map(h => h.key)), [s, hist]);
  const canMove = !outcomeNow && !promo && !thinking && aiIntent === null && (mode === "local" || s.turn === playerColor);
  const targets = useMemo(() => (selected === null ? [] : legal.filter(m => m.from === selected)), [legal, selected]);
  const checkSq = useMemo(() => (inCheck(s) ? findKing(s.board, s.turn) : null), [s]);

  /* ---------- timers ---------- */
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); }, []);
  const clearTimers = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), []);
  useEffect(() => { const t = window.setTimeout(() => setIntro(false), 2200); return () => window.clearTimeout(t); }, []);

  /* ---------- board size ---------- */
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const avail = w >= 1024 ? Math.min(w - 470, h - 250) : Math.min(w - (w >= 768 ? 70 : 28), 620);
      setBoardPx(Math.max(256, Math.min(600, Math.floor(avail / 8) * 8)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const q = boardPx / 8;

  /* ---------- particles on the board ---------- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<Spark[]>([]);
  const loopOn = useRef(false);
  const timeScale = useRef(1); // < 1 = slow motion (checkmate scene)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = boardPx * dpr; c.height = boardPx * dpr;
  }, [boardPx]);
  const runParticles = useCallback(() => {
    if (loopOn.current) return;
    loopOn.current = true;
    let prev = performance.now();
    const frame = (t: number) => {
      const c = canvasRef.current, ctx = c?.getContext("2d");
      if (!c || !ctx) { loopOn.current = false; return; }
      const dt = Math.min(0.05, (t - prev) / 1000) * timeScale.current; prev = t;
      const dpr = c.width / (c.clientWidth || 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts.current = parts.current.filter(p => {
        p.life -= p.decay * dt;
        if (p.life <= 0) return false;
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 1 - 1.4 * dt; p.rot += p.vr * dt;
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        if (p.kind === "shard") {
          ctx.globalCompositeOperation = "source-over";
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.8, p.size * 0.7); ctx.lineTo(-p.size * 0.7, p.size * 0.5); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = "rgba(255,240,200,0.5)"; ctx.lineWidth = 0.8; ctx.stroke();
          ctx.restore();
        } else if (p.kind === "spark") {
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
        } else if (p.kind === "ring") {
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = p.color; ctx.lineWidth = 3 * p.life;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.15 - p.life), 0, TAU); ctx.stroke();
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - p.life), 0, TAU); ctx.fill();
        }
        return true;
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (parts.current.length) requestAnimationFrame(frame);
      else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); loopOn.current = false; }
    };
    requestAnimationFrame(frame);
  }, []);
  const center = useCallback((v: number) => ({ x: ((v & 7) + 0.5) * q, y: ((v >> 3) + 0.5) * q }), [q]);
  const shatter = useCallback((v: number, c: Color, big: boolean) => {
    if (reduceMotion()) return;
    const { x, y } = center(v);
    const pal = c === "w" ? ["#fffaf0", "#efe6d4", "#d8c9a8", "#ffffff"] : ["#4a4550", "#1c1a20", "#6b6570", "#0c0b0f"];
    for (let i = 0; i < (big ? 38 : 24); i++) {
      const a = Math.random() * TAU, sp = q * (2 + Math.random() * (big ? 6 : 4));
      parts.current.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - q * 2.2, life: 1, decay: 0.8 + Math.random() * 0.6, size: q * (0.07 + Math.random() * 0.13), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 22, color: pal[i % 4], kind: "shard", g: q * 13 });
    }
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * TAU, sp = q * (3 + Math.random() * 5);
      parts.current.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: 1.7, size: q * 0.04 + 0.6, rot: 0, vr: 0, color: Math.random() < 0.5 ? "#ffd27a" : "#fff3c4", kind: "spark", g: q * 5 });
    }
    parts.current.push({ x, y, vx: 0, vy: 0, life: 1, decay: 2.2, size: q * (big ? 2.4 : 1.5), rot: 0, vr: 0, color: "rgba(255,214,140,0.9)", kind: "ring", g: 0 });
    runParticles();
  }, [center, q, runParticles]);
  const dust = useCallback((v: number, amount = 1) => {
    if (reduceMotion()) return;
    const { x, y } = center(v);
    for (let i = 0; i < Math.round(9 * amount); i++) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      parts.current.push({ x: x + dir * q * 0.15, y: y + q * 0.34, vx: dir * q * (0.8 + Math.random() * 1.6), vy: -q * Math.random() * 0.5, life: 1, decay: 2.4, size: q * (0.04 + Math.random() * 0.05), rot: 0, vr: 0, color: "rgba(220,205,180,0.35)", kind: "dust", g: 0 });
    }
    runParticles();
  }, [center, q, runParticles]);
  const sparkle = useCallback((v: number) => {
    if (reduceMotion()) return;
    const { x, y } = center(v);
    for (let i = 0; i < 46; i++) {
      parts.current.push({ x: x + (Math.random() - 0.5) * q * 0.8, y: y + (Math.random() - 0.2) * q * 0.6, vx: (Math.random() - 0.5) * q * 1.5, vy: -q * (1.5 + Math.random() * 4), life: 1, decay: 1 + Math.random() * 0.6, size: 0.8 + Math.random() * q * 0.04, rot: 0, vr: 0, color: Math.random() < 0.6 ? "#ffe9a8" : "#ffffff", kind: "spark", g: -q * 0.8 });
    }
    parts.current.push({ x, y, vx: 0, vy: 0, life: 1, decay: 1.8, size: q * 1.8, rot: 0, vr: 0, color: "rgba(255,230,160,0.9)", kind: "ring", g: 0 });
    runParticles();
  }, [center, q, runParticles]);

  const ringAt = useCallback((v: number, color: string, size: number, decay = 2.2) => {
    if (reduceMotion()) return;
    const { x, y } = center(v);
    parts.current.push({ x, y, vx: 0, vy: 0, life: 1, decay, size, rot: 0, vr: 0, color, kind: "ring", g: 0 });
    runParticles();
  }, [center, runParticles]);
  const sparksAt = useCallback((v: number, color: string, n: number, speed = 5, rise = 0) => {
    if (reduceMotion()) return;
    const { x, y } = center(v);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = q * (1 + Math.random() * speed);
      parts.current.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rise * q, life: 1, decay: 1.1 + Math.random() * 0.8, size: 0.7 + Math.random() * q * 0.05, rot: 0, vr: 0, color, kind: "spark", g: q * 2 });
    }
    runParticles();
  }, [center, q, runParticles]);

  const stageRef = useRef<HTMLDivElement>(null);
  const shake = useCallback((amp: number) => {
    if (reduceMotion()) return;
    stageRef.current?.animate(
      [{ transform: "translate(0,0)" }, { transform: `translate(${-amp}px,${amp * 0.5}px)` }, { transform: `translate(${amp * 0.8}px,${-amp * 0.6}px)` }, { transform: `translate(${-amp * 0.5}px,${-amp * 0.3}px)` }, { transform: `translate(${amp * 0.3}px,${amp * 0.2}px)` }, { transform: "translate(0,0)" }],
      { duration: 420, easing: "ease-out" },
    );
  }, []);

  /* ---------- search worker ---------- */
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, { resolve: (r: SearchResult | null) => void; st: State; lv: Level }>());
  const msgId = useRef(0);
  useEffect(() => {
    let w: Worker | null = null;
    try {
      w = new Worker(new URL("../lib/chessWorker.ts", import.meta.url), { type: "module" });
      w.onmessage = (e: MessageEvent<{ id: number; result: SearchResult | null }>) => {
        pending.current.get(e.data.id)?.resolve(e.data.result);
        pending.current.delete(e.data.id);
      };
      w.onerror = () => {
        // Worker unavailable: finish the outstanding searches on the main thread.
        workerRef.current = null;
        pending.current.forEach(p => p.resolve(searchBestMove(p.st, p.lv)));
        pending.current.clear();
      };
      workerRef.current = w;
    } catch { workerRef.current = null; }
    return () => w?.terminate();
  }, []);
  const search = useCallback((st: State, lv: Level) => new Promise<SearchResult | null>(resolve => {
    const w = workerRef.current;
    if (!w) { window.setTimeout(() => resolve(searchBestMove(st, lv)), 30); return; }
    const id = ++msgId.current;
    pending.current.set(id, { resolve, st, lv });
    w.postMessage({ id, state: st, level: lv });
  }), []);

  /* ---------- committing moves ---------- */
  const lastDragged = useRef<number | null>(null);
  const skipFlipIds = useRef(new Set<number>());
  const hintReq = useRef(0);
  const commit = useCallback((m: Move, dragged = false) => {
    hintReq.current++;
    if (dragged) { skipFlipIds.current.add(m.piece.id); lastDragged.current = m.piece.id; } else lastDragged.current = null;
    setHist(h => {
      const cur = h[h.length - 1].state;
      const next = makeMove(cur, m);
      return [...h, { state: next, move: m, san: toSAN(cur, m), key: positionKey(next) }];
    });
    setSelected(null);
    setHint(null);
  }, []);

  const tryMove = (from: number, to: number, dragged = false) => {
    const ms = legal.filter(m => m.from === from && m.to === to);
    if (!ms.length) return false;
    if (ms.length > 1 && ms[0].promo) { setPromo({ from, to, dragged }); return true; }
    commit(ms[0], dragged);
    return true;
  };
  const choosePromo = (t: PieceType) => {
    if (!promo) return;
    const m = legal.find(x => x.from === promo.from && x.to === promo.to && x.promo === t);
    setPromo(null);
    if (m) commit(m, promo.dragged);
  };

  /* ---------- effects of each new move ---------- */
  const prevLen = useRef(hist.length);
  useEffect(() => {
    const grew = hist.length > prevLen.current;
    prevLen.current = hist.length;
    if (!grew) return;
    const last = hist[hist.length - 1];
    const m = last.move;
    if (!m) return;
    const dragged = lastDragged.current === m.piece.id;
    const fly = dragged || reduceMotion() ? 0 : flightMs(m.from, m.to, m.piece.t === "n");
    const vTo = vOf(m.to);
    play(m.captured ? "capture" : m.castle ? "castle" : "move", fly);
    if (m.captured) {
      const cap = m.captured;
      const key = `cap-${cap.id}-${hist.length}`;
      setGhosts(g => [...g, { key, piece: cap, v: vOf(m.capSq), delay: fly }]);
      later(() => {
        shatter(vOf(m.capSq), cap.c, VALUE[cap.t] >= 500);
        shake(VALUE[cap.t] >= 500 ? 7 : 3);
        // The captured piece's "soul" flies to the capturer's tray.
        const from = spinRef.current?.querySelector(`[data-sq="${m.capSq}"]`)?.getBoundingClientRect();
        const tray = trayRefs.current[m.piece.c]?.getBoundingClientRect();
        if (from && tray && !reduceMotion()) {
          const n = hist.filter(h => h.move?.captured && h.move.piece.c === m.piece.c).length;
          const skey = `soul-${key}`;
          setSouls(list => [...list, {
            key: skey, x0: from.left + from.width / 2, y0: from.top + from.height / 2,
            x1: tray.left + 8 + (n - 1) * 10, y1: tray.top + tray.height / 2,
            color: cap.c === "w" ? "255, 246, 220" : "196, 181, 253",
          }]);
          later(() => setSouls(list => list.filter(x => x.key !== skey)), 900);
          play("soul", 650);
        }
      }, fly);
      later(() => setGhosts(g => g.filter(x => x.key !== key)), fly + 700);
    } else {
      later(() => { dust(vTo); ringAt(vTo, "rgba(255,214,140,0.75)", q * 0.85, 2.8); }, fly);
    }
    if (m.castle) {
      const rookTo = vOf(m.castle === "k" ? m.to - 1 : m.to + 1);
      later(() => { sparksAt(vTo, "#fde68a", 14, 2.5, 1.5); sparksAt(rookTo, "#fde68a", 14, 2.5, 1.5); ringAt(rookTo, "rgba(253,230,138,0.8)", q * 1.1); }, fly + 90);
    }
    if (m.promo) {
      later(() => {
        setBeam(vTo); sparkle(vTo); play("promote");
        const inner = pieceEls.current.get(m.piece.id)?.firstElementChild as HTMLElement | undefined;
        inner?.animate(
          [{ transform: "scale(0.3)", filter: "brightness(4) blur(3px)" }, { offset: 0.55, transform: "scale(1.35)", filter: "brightness(2)" }, { transform: "scale(1)", filter: "none" }],
          { duration: 750, easing: "cubic-bezier(.34,1.56,.64,1)" },
        );
      }, fly);
      later(() => setBeam(null), fly + 1100);
    }
    const res = outcome(last.state, hist.map(h => h.key));
    if (res) later(() => setOver(res), fly + 350);
    else if (inCheck(last.state)) {
      later(() => { setBanner(Date.now()); play("check"); shake(4); }, fly + 60);
      later(() => setBanner(null), fly + 1300);
    }
    if (!(mode === "ai" && m.piece.c !== playerColor)) setEvalScore(evaluate(last.state.board));
    // hist is the only trigger; the rest are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hist]);

  /* ---------- game over: the checkmate finisher cutscene ---------- */
  const pieceEls = useRef(new Map<number, HTMLDivElement>());
  const fallenFor = (st: State, loser: Color, kV: number, instant: boolean) => {
    const out: Record<number, { dir: number; delay: number }> = {};
    st.board.forEach((p, sq) => {
      if (!p || p.c !== loser || p.t === "k") return;
      const v = vOf(sq);
      const d = Math.hypot((v & 7) - (kV & 7), (v >> 3) - (kV >> 3));
      out[p.id] = { dir: (v & 7) < (kV & 7) ? -1 : (v & 7) > (kV & 7) ? 1 : Math.random() < 0.5 ? -1 : 1, delay: instant ? 0 : 150 + d * 110 };
    });
    return out;
  };
  const camTo = (from: string, to: string, ms: number) => {
    const el = cameraRef.current;
    if (!el) return;
    const prev = el.getAnimations();
    el.animate([{ transform: from }, { transform: to }], { duration: ms, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
    prev.forEach(a => a.cancel());
  };

  useEffect(() => {
    if (!over) return;
    const st = stateRef.current;
    if (over.kind !== "checkmate") {
      play("draw");
      later(() => setShowResult(true), 700);
      return;
    }
    const winner = over.winner, loser = other(winner);
    const playerWon = mode === "local" || winner === playerColor;
    if (mode === "ai" && winner === playerColor) {
      unlock("chess-win");
      if (level === "hard") unlock("grandmaster");
    }
    const k = findKing(st.board, loser);
    const king = st.board[k];
    const atks = attackersOf(st.board, k, winner);
    const lastTo = hist[hist.length - 1].move?.to ?? -1;
    // The piece that just moved, if it gives check; otherwise (discovered mate) the strongest checker.
    const atkSq = atks.includes(lastTo) ? lastTo : [...atks].sort((a, b) => VALUE[st.board[b]!.t] - VALUE[st.board[a]!.t])[0];
    const atk = atkSq !== undefined ? st.board[atkSq] : null;
    if (reduceMotion() || !king || !atk) { setShowResult(true); return; }

    const aV = vOf(atkSq), kV = vOf(k);
    const path = pathPoints(aV, kV, atk.t);
    const B = boardPx, C = B / 2, Q = B / 8;
    const ax = ((aV & 7) + 0.5) * Q, ay = ((aV >> 3) + 0.5) * Q, kx = ((kV & 7) + 0.5) * Q, ky = ((kV >> 3) + 0.5) * Q;
    const dist = Math.hypot((aV & 7) - (kV & 7), (aV >> 3) - (kV >> 3));
    // Zoom in, but never so far that attacker and king can't both fit between the cinema bars.
    const sc = Math.max(1.15, Math.min(2, 5.4 / (dist + 1.7), (B * 0.82) / (Math.abs(ax - kx) + Q * 1.2), (B * 0.6) / (Math.abs(ay - ky) + Q * 1.2)));
    let tx = -sc * ((ax + kx) / 2 - C), ty = -sc * ((ay + ky) / 2 - C);
    // Nudge the frame so both actors sit inside the safe area (bars cover the top and bottom 10%).
    for (let pass = 0; pass < 2; pass++) {
      for (const [px, py] of [[ax, ay], [kx, ky]]) {
        const sx = C + sc * (px - C) + tx, sy = C + sc * (py - C) + ty;
        if (sx < B * 0.1) tx += B * 0.1 - sx; else if (sx > B * 0.9) tx -= sx - B * 0.9;
        if (sy < B * 0.2) ty += B * 0.2 - sy; else if (sy > B * 0.82) ty -= sy - B * 0.82;
      }
    }
    // A sliver past the board edge is fine: it disappears under the bars.
    const lim = C * (sc - 1) + B * 0.12;
    const clamp = (v: number) => Math.max(-lim, Math.min(lim, v));
    tx = clamp(tx); ty = clamp(ty);
    const tilt = (aV & 7) <= (kV & 7) ? -2.5 : 2.5;
    const zoomed = `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${tilt}deg)`;
    const home = "translate(0px, 0px) scale(1) rotate(0deg)";
    const fin = FINISHERS[atk.t];
    const ph = (n: number, extra?: Partial<Cine>) => setCine(c => (c ? { ...c, phase: n, ...extra } : c));
    const inner = (id: number) => pieceEls.current.get(id)?.firstElementChild as HTMLElement | undefined;

    setCine({
      phase: 1, winner, atkId: atk.id, atkT: atk.t, atkC: atk.c, kingId: king.id, aV, kV, path,
      cam: { s: sc, tx, ty }, crown: false, kingGone: false, fallen: null, san: hist[hist.length - 1].san,
      bolts: atk.t === "q" ? [boltAlong(path, 0.22), boltAlong(path, 0.3)] : [],
    });
    // 1. Freeze: colour drains, bars slide in, heartbeat.
    play("boom"); play("heartbeat", 500); play("heartbeat", 1350);
    // 2. Camera pushes in; the finisher's name card.
    later(() => camTo(home, zoomed, 1500), 250);
    later(() => { ph(2); play("whoosh"); }, 950);
    // 3. Charge: the attacker powers up along the line of attack.
    later(() => {
      ph(3); play("charge");
      sparksAt(aV, `rgb(${fin.glow})`, 26, 2.5, 1.5);
      ringAt(aV, `rgba(${fin.glow},0.9)`, Q * 1.4, 1.6);
      if (atk.t === "r") {
        // Shockwaves pound down the file/rank towards the king.
        const n = Math.round(dist);
        for (let i = 1; i <= n; i++) {
          const v = Math.round(((aV >> 3) + (((kV >> 3) - (aV >> 3)) * i) / n)) * 8 + Math.round((aV & 7) + (((kV & 7) - (aV & 7)) * i) / n);
          later(() => { ringAt(v, `rgba(${fin.glow},0.85)`, Q * 1.2, 2.4); dust(v, 0.8); play("move"); }, i * 90);
        }
      }
      if (atk.t === "b") for (let i = 1; i <= Math.round(dist); i++) {
        const v = Math.round(((aV >> 3) + (((kV >> 3) - (aV >> 3)) * i) / Math.round(dist))) * 8 + Math.round((aV & 7) + (((kV & 7) - (aV & 7)) * i) / Math.round(dist));
        later(() => sparksAt(v, "#e0f2fe", 10, 1.5, 2), i * 70);
      }
      if (atk.t === "n") { dust(aV, 2); later(() => dust(aV, 2), 200); }
    }, 2050);
    // 4. Strike: a phantom of the attacker dashes into the king.
    later(() => { ph(4); play(atk.t === "q" || atk.t === "b" ? "zap" : "whoosh"); }, 2850);
    // 5. Impact: flash, cracks, slow motion.
    later(() => {
      ph(5);
      play("impact"); play("crack", 140);
      shake(14);
      timeScale.current = 0.35;
      ringAt(kV, "rgba(255,255,255,0.95)", Q * 1.8, 2);
      ringAt(kV, `rgba(${fin.glow},0.9)`, Q * 3.2, 1.3);
      sparksAt(kV, `rgb(${fin.glow})`, 40, 6, 1);
      sparksAt(kV, "#ffffff", 20, 4, 1);
      inner(king.id)?.animate(
        [{ transform: "translate(0,0)" }, { transform: "translate(-6%,0) rotate(-4deg)" }, { transform: "translate(6%,0) rotate(4deg)" }, { transform: "translate(-4%,0)" }, { transform: "translate(0,0)" }],
        { duration: 360, iterations: 2 },
      );
    }, 3200);
    // 6. The crown flies off; the king topples, then shatters.
    later(() => { ph(5, { crown: true }); play("crown", 1150); play("crown", 1450); play("crown", 1620); }, 3550);
    later(() => {
      const dir = (kV & 7) >= (aV & 7) ? 1 : -1;
      inner(king.id)?.animate(
        [{ transform: "rotate(0deg)" }, { offset: 0.3, transform: `rotate(${-dir * 12}deg)` }, { offset: 0.8, transform: `rotate(${dir * 98}deg) translateY(10%)` }, { transform: `rotate(${dir * 90}deg) translateY(8%)` }],
        { duration: 1000, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" },
      );
    }, 3700);
    later(() => {
      ph(5, { crown: true, kingGone: true });
      timeScale.current = 0.55;
      shatter(kV, loser, true); shatter(kV, loser, true);
      play("thud"); shake(10);
    }, 4750);
    // 7. Aftermath: camera pulls back, the losing army falls like dominoes, winners salute.
    later(() => {
      timeScale.current = 1;
      camTo(zoomed, home, 1200);
      ph(6, { crown: true, kingGone: true, fallen: fallenFor(stateRef.current, loser, kV, false) });
      play("choir"); play(playerWon ? "win" : "lose", 300);
      stateRef.current.board.forEach((p, sq) => {
        if (!p || p.c !== winner) return;
        const v = vOf(sq);
        inner(p.id)?.animate(
          [{ transform: "translateY(0)", filter: "none" }, { offset: 0.4, transform: "translateY(-30%) scale(1.12)", filter: `drop-shadow(0 0 10px rgba(${fin.glow},0.9))` }, { offset: 0.72, transform: "translateY(0) scale(1.06,0.94)" }, { transform: "translateY(0)", filter: "none" }],
          { duration: 700, delay: 500 + ((v >> 3) + (v & 7)) * 55, easing: "ease-out" },
        );
      });
    }, 5150);
    later(() => { if (playerWon) setFireworks(f => f + 1); }, 5600);
    later(() => { ph(7); setShowResult(true); }, 7600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const skipCine = () => {
    if (!cine || cine.phase >= 6) return;
    clearTimers();
    cameraRef.current?.getAnimations().forEach(a => a.cancel());
    timeScale.current = 1;
    parts.current = [];
    const playerWon = mode === "local" || cine.winner === playerColor;
    setCine(c => (c ? { ...c, phase: 7, crown: false, kingGone: true, fallen: fallenFor(stateRef.current, other(c.winner), c.kV, true) } : c));
    setShowResult(true);
    if (playerWon) setFireworks(f => f + 1);
  };

  /* ---------- computer opponent ---------- */
  const reqId = useRef(0);
  useEffect(() => {
    if (mode !== "ai" || outcomeNow || promo || s.turn === playerColor) return;
    const id = ++reqId.current;
    setThinking(true);
    const started = performance.now();
    const minThink = hist.length === 1 ? 1500 : 650;
    void search(s, level).then(res => {
      if (id !== reqId.current || !res) return;
      window.setTimeout(() => {
        if (id !== reqId.current) return;
        setThinking(false);
        setEvalScore(res.score);
        setAiInfo({ depth: res.depth, nodes: res.nodes });
        setAiIntent(res.from);
        window.setTimeout(() => {
          if (id !== reqId.current) return;
          setAiIntent(null);
          const cur = stateRef.current;
          const m = legalMoves(cur).find(x => x.from === res.from && x.to === res.to && (x.promo ?? null) === (res.promo ?? null));
          if (m) commit(m);
        }, 420);
      }, Math.max(0, minThink - (performance.now() - started)));
    });
    // Bumping the counter is the point: it invalidates this search's pending result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { reqId.current++; setThinking(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, mode, playerColor, level, outcomeNow, promo]);

  /* ---------- FLIP: animate every piece from where it was to where it is ---------- */
  const prevPos = useRef(new Map<number, number>());
  const everSeen = useRef(new Set<number>());
  const skipAll = useRef(false);
  const glide = useRef(false);
  const spinAnims = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const reduce = reduceMotion();
    if (spinAnims.current.length) { spinAnims.current.forEach(a => a.cancel()); spinAnims.current = []; }
    const next = new Map<number, number>();
    s.board.forEach((p, sq) => { if (p) next.set(p.id, vOf(sq)); });
    const firstRender = prevPos.current.size === 0;
    const isGlide = glide.current;
    const noFlip = skipAll.current;
    glide.current = false;
    skipAll.current = false;
    const lastMove = hist[hist.length - 1].move;
    next.forEach((v, id) => {
      const el = pieceEls.current.get(id);
      if (!el || reduce) return;
      const inner = el.firstElementChild as HTMLElement | null;
      const old = prevPos.current.get(id);
      const piece = s.board[orientation === "w" ? v : 63 - v];
      if (old === undefined) {
        if (everSeen.current.has(id)) {
          inner?.animate(
            [{ opacity: 0, transform: "scale(0.2)", filter: "brightness(3) blur(4px)" }, { offset: 0.6, opacity: 1, transform: "scale(1.15)", filter: "brightness(1.6)" }, { opacity: 1, transform: "scale(1)", filter: "none" }],
            { duration: 560, delay: 220, easing: "ease-out", fill: "backwards" },
          );
        } else {
          const delay = firstRender ? 450 + (v >> 3) * 75 + (v & 7) * 22 : 150 + Math.random() * 200;
          inner?.animate(
            [{ opacity: 0, transform: "translateY(-320%) scale(1.3)" }, { offset: 0.68, opacity: 1, transform: "translateY(4%) scale(0.96,1.04)" }, { offset: 0.84, transform: "translateY(0) scale(1.1,0.9)" }, { opacity: 1, transform: "none" }],
            { duration: 640, delay, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" },
          );
          later(() => dust(v, firstRender ? 0.45 : 1), delay + 430);
        }
        return;
      }
      if (old === v || noFlip) return;
      if (skipFlipIds.current.has(id)) {
        inner?.animate([{ transform: "scale(1.15)" }, { offset: 0.5, transform: "scale(1.1,0.88)" }, { transform: "scale(1)" }], { duration: 240, easing: "ease-out" });
        return;
      }
      const ox = (old & 7) * 100, oy = (old >> 3) * 100, nx = (v & 7) * 100, ny = (v >> 3) * 100;
      const knight = piece?.t === "n";
      const dist = Math.hypot(nx - ox, ny - oy) / 100;
      const dur = isGlide ? 850 : flightMs(old, v, knight);
      const delay = isGlide ? Math.random() * 300 : lastMove?.castle && piece?.t === "r" ? 90 : 0;
      const lift = isGlide ? 70 : knight ? 90 : 30 + dist * 5;
      // The extra flight shadow is a paint cost, so only single moves get it (not the 32-piece glide).
      const sh = (y: number, b: number, a: number) => (isGlide ? {} : { filter: `drop-shadow(0px ${y}px ${b}px rgba(0,0,0,${a}))` });
      el.animate(
        [
          { transform: `translate(${ox}%, ${oy}%) translateY(0%) scale(1)`, zIndex: 40, ...sh(0, 0, 0) },
          { offset: 0.5, transform: `translate(${(ox + nx) / 2}%, ${(oy + ny) / 2}%) translateY(-${lift}%) scale(${isGlide ? 1.12 : 1.22})`, zIndex: 40, ...sh(q * 0.3, q * 0.16, 0.45) },
          { offset: 0.86, transform: `translate(${nx}%, ${ny}%) translateY(0%) scale(1)`, zIndex: 40, ...sh(0, 0, 0) },
          { transform: `translate(${nx}%, ${ny}%) translateY(0%) scale(1)`, zIndex: 40, ...sh(0, 0, 0) },
        ],
        { duration: dur, delay, easing: "cubic-bezier(.4,.1,.3,1)", fill: "backwards" },
      );
      if (knight && !isGlide) {
        inner?.animate([{ transform: "rotate(0deg)" }, { offset: 0.45, transform: "rotate(-24deg)" }, { offset: 0.8, transform: "rotate(7deg)" }, { transform: "rotate(0deg)" }], { duration: dur });
      } else {
        inner?.animate([{ transform: "scale(1,1)" }, { offset: 0.5, transform: "scale(1.12,0.86)" }, { transform: "scale(1,1)" }], { duration: 230, delay: delay + dur * 0.86 });
      }
    });
    skipFlipIds.current.clear();
    next.forEach((_, id) => everSeen.current.add(id));
    prevPos.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, orientation]);

  /* ---------- controls ---------- */
  const cancelPieceFx = () => pieceEls.current.forEach(el => (el.firstElementChild as HTMLElement | null)?.getAnimations().forEach(a => a.cancel()));
  const resetUi = () => {
    clearTimers();
    reqId.current++; hintReq.current++;
    setSelected(null); setPromo(null); setHint(null); setHintBusy(false); setOver(null); setShowResult(false);
    setBanner(null); setBeam(null); setSpot(null); setThinking(false); setAiIntent(null); setGhosts([]);
    setCine(null); setSouls([]);
    timeScale.current = 1;
    cameraRef.current?.getAnimations().forEach(a => a.cancel());
  };

  const newGame = (opts?: { player?: Color; mode?: Mode }) => {
    const player = opts?.player ?? playerColor;
    const md = opts?.mode ?? mode;
    resetUi();
    cancelPieceFx();
    // Survivors glide back to their home squares; missing pieces drop in, extras fade out.
    const fresh = parseFEN(START_FEN);
    const pool = s.board.map((p, sq) => (p ? { p, sq } : null)).filter((x): x is { p: Piece; sq: number } => !!x);
    const used = new Set<number>();
    const d = (a: number, b: number) => Math.abs((a >> 3) - (b >> 3)) + Math.abs((a & 7) - (b & 7));
    fresh.board = fresh.board.map((p, sq) => {
      if (!p) return p;
      const cands = pool.filter(x => !used.has(x.p.id) && x.p.c === p.c && x.p.t === p.t).sort((a, b) => d(a.sq, sq) - d(b.sq, sq));
      if (!cands.length) return p;
      used.add(cands[0].p.id);
      return { ...p, id: cands[0].p.id };
    });
    const extras = pool.filter(x => !used.has(x.p.id));
    if (extras.length) {
      setGhosts(extras.map(x => ({ key: `x-${x.p.id}`, piece: x.p, v: vOf(x.sq), delay: 0, fade: true })));
      later(() => setGhosts([]), 800);
    }
    glide.current = true;
    if (md === "ai") setOrientation(player);
    prevLen.current = 1;
    setHist([{ state: fresh, move: null, san: "", key: positionKey(fresh) }]);
    setEvalScore(0);
    setAiInfo(null);
    play("whoosh");
  };

  const undo = () => {
    if (hist.length <= 1) return;
    let n = 1;
    const lastMove = hist[hist.length - 1].move;
    if (mode === "ai" && lastMove && lastMove.piece.c !== playerColor && hist.length > 2) n = 2;
    resetUi();
    cancelPieceFx();
    setHist(h => h.slice(0, Math.max(1, h.length - n)));
    play("whoosh");
  };

  const spinRef = useRef<HTMLDivElement>(null);
  const flip = () => {
    const el = spinRef.current;
    setSelected(null);
    if (!el || reduceMotion()) { skipAll.current = true; setOrientation(o => other(o)); return; }
    const opts: KeyframeAnimationOptions = { duration: 950, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" };
    const anims = [el.animate([{ transform: "rotate(0deg) scale(1)" }, { offset: 0.5, transform: "rotate(90deg) scale(0.8)" }, { transform: "rotate(180deg) scale(1)" }], opts)];
    pieceEls.current.forEach(p => {
      const inner = p.firstElementChild as HTMLElement | null;
      if (inner) anims.push(inner.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-180deg)" }], opts));
    });
    spinAnims.current = anims;
    anims[0].onfinish = () => { skipAll.current = true; setOrientation(o => other(o)); };
    play("whoosh");
  };

  const askHint = () => {
    if (!canMove || hintBusy) return;
    setHintBusy(true);
    const id = ++hintReq.current;
    void search(s, "medium").then(r => {
      if (id !== hintReq.current) return;
      setHintBusy(false);
      if (!r) return;
      setHint({ from: r.from, to: r.to });
      setSelected(r.from);
    });
  };

  /* ---------- pointer: click or drag ---------- */
  const drag = useRef<{ sq: number; x0: number; y0: number; active: boolean; wasSelected: boolean } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const lastX = useRef(0);
  const sqFromEvent = (e: { clientX: number; clientY: number }) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-sq]");
    return el ? Number(el.dataset.sq) : null;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    ensure();
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-sq]");
    if (!el || !canMove) return;
    const sq = Number(el.dataset.sq);
    const p = s.board[sq];
    if (p && p.c === s.turn) {
      const wasSelected = selected === sq;
      setSelected(sq);
      setHint(h => (h && h.from === sq ? h : null));
      play("select");
      if (!legal.some(m => m.from === sq)) {
        (pieceEls.current.get(p.id)?.firstElementChild as HTMLElement | undefined)?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-8%) rotate(-6deg)" }, { transform: "translateX(8%) rotate(6deg)" }, { transform: "translateX(0)" }], { duration: 300 });
      }
      drag.current = { sq, x0: e.clientX, y0: e.clientY, active: false, wasSelected };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (selected !== null && tryMove(selected, sq)) return;
    setSelected(null);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.active && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) { d.active = true; setDragSq(d.sq); }
    if (d.active && ghostRef.current) {
      const size = q * 1.3;
      const tilt = Math.max(-18, Math.min(18, (e.clientX - lastX.current) * 1.2));
      ghostRef.current.style.transform = `translate(${e.clientX - size / 2}px, ${e.clientY - size * 0.62}px) rotate(${tilt}deg)`;
    }
    lastX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.active) {
      setDragSq(null);
      const to = sqFromEvent(e);
      if (to !== null && to !== d.sq && tryMove(d.sq, to, true)) return;
      return;
    }
    if (d.wasSelected) setSelected(null);
  };
  const skipRef = useRef(skipCine);
  skipRef.current = skipCine;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.body.dataset.palette === "open") return;
      if (e.key === "Escape") { setSelected(null); setPromo(null); skipRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- pointer tilt for the 3D stage ---------- */
  const tiltRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const step = () => {
      cur.x += (tgt.x - cur.x) * 0.06; cur.y += (tgt.y - cur.y) * 0.06;
      if (tiltRef.current) tiltRef.current.style.transform = `rotateX(${(-cur.y * 6).toFixed(2)}deg) rotateY(${(cur.x * 7).toFixed(2)}deg)`;
      raf = Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.001 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (drag.current?.active) return;
      tgt.x = e.clientX / window.innerWidth - 0.5; tgt.y = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  /* ---------- derived display data ---------- */
  const lastMove = snap.move;
  const capturedBy = useMemo(() => {
    const out: Record<Color, PieceType[]> = { w: [], b: [] };
    for (const h of hist) if (h.move?.captured) out[h.move.piece.c].push(h.move.captured.t);
    return out;
  }, [hist]);
  const material = useMemo(() => {
    const m: Record<Color, number> = { w: 0, b: 0 };
    for (const p of s.board) if (p) m[p.c] += VALUE[p.t];
    return m;
  }, [s]);
  const sans = hist.slice(1).map(h => h.san);
  const movesRef = useRef<HTMLDivElement>(null);
  useEffect(() => { movesRef.current?.scrollTo({ top: movesRef.current.scrollHeight, behavior: "smooth" }); }, [sans.length]);

  const whiteShare = Math.abs(evalScore) > MATE_SCORE - 1000 ? (evalScore > 0 ? 100 : 0) : 50 + 50 * Math.tanh(evalScore / 600);
  const bottom = orientation;
  const top = other(orientation);

  const resultText = (() => {
    const o = over;
    if (!o) return null;
    if (o.kind === "checkmate") {
      const title = "CHECKMATE";
      const sub = mode === "ai" ? (o.winner === playerColor ? "You win! 👑" : "The computer wins") : `${o.winner === "w" ? "White" : "Black"} wins`;
      return { title, sub };
    }
    const why = { stalemate: "Stalemate", fifty: "50-move rule", insufficient: "Not enough material to mate", repetition: "Threefold repetition" }[o.kind];
    return { title: "DRAW", sub: why };
  })();

  const status = (() => {
    if (outcomeNow) return resultText?.sub ?? "Game over";
    if (thinking) return "Computer is thinking…";
    const who = mode === "ai" ? (s.turn === playerColor ? "Your move" : "Computer's move") : `${s.turn === "w" ? "White" : "Black"} to move`;
    return checkSq !== null ? `Check! ${who}` : who;
  })();

  const strip = (side: Color) => {
    const isAi = mode === "ai" && side !== playerColor;
    const name = mode === "ai" ? (isAi ? "Computer" : "You") : side === "w" ? "White" : "Black";
    const tag = mode === "ai" ? (isAi ? LEVEL_LABEL[level] : side === "w" ? "White" : "Black") : "";
    const active = !outcomeNow && s.turn === side;
    const diff = Math.round((material[side] - material[other(side)]) / 100);
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-500 ${active ? "border-amber-300/50 bg-amber-300/[0.07] shadow-[0_0_24px_rgba(245,200,107,0.15)]" : "border-white/10 bg-white/[0.03]"}`}>
        <div className="relative w-9 h-9 shrink-0 rounded-lg flex items-center justify-center" style={{ background: side === "w" ? "linear-gradient(135deg,#fff,#cbbd9f)" : "linear-gradient(135deg,#4a4550,#0d0c10)" }}>
          {isAi ? <Bot size={18} className={side === "w" ? "text-stone-800" : "text-amber-200"} /> : <PieceSvg t="k" c={side} className="w-7 h-7" />}
          {active && <span className="absolute -inset-1 rounded-xl border border-amber-300/60" style={{ animation: "chessTurnRing 1.6s ease-out infinite" }} />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">
            {name}
            {tag && <span className="ml-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">{tag}</span>}
          </p>
          <div ref={el => { trayRefs.current[side] = el; }} className="flex items-center h-4 -space-x-1.5">
            {capturedBy[side].map((t, i) => {
              const newest = i === capturedBy[side].length - 1 && lastMove?.captured && lastMove.piece.c === side;
              const delay = newest && lastMove ? flightMs(lastMove.from, lastMove.to, lastMove.piece.t === "n") + 700 : 0;
              return <PieceSvg key={i} t={t} c={other(side)} className="w-4 h-4" style={{ animation: `chessPop .45s cubic-bezier(.34,1.56,.64,1) ${delay}ms both` }} />;
            })}
            {diff > 0 && <span className="pl-2.5 text-[10px] font-bold text-emerald-300">+{diff}</span>}
          </div>
        </div>
        <div className="ml-auto text-[11px]">
          {active && isAi && thinking ? (
            <span className="flex items-center gap-1 text-cyan-300">thinking<span className="chess-dots"><i /><i /><i /></span></span>
          ) : active ? <span className="text-amber-200/80">to move</span> : null}
        </div>
      </div>
    );
  };

  const targetSet = new Map(targets.map(m => [m.to, m]));

  return (
    <section className="relative min-h-screen pt-36 md:pt-24 pb-14 overflow-hidden text-white page-transition">
      <ChessDefs />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a1d0c_0%,#0b0907_55%,#050404_100%)]" />
      {/* Ambient giant pieces drifting in the background (tablet and up; phones skip the extra work) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block" aria-hidden="true">
        {([["k", "8%", "18%", 0], ["q", "80%", "12%", 3], ["n", "86%", "62%", 6], ["r", "4%", "70%", 9]] as [PieceType, string, string, number][]).map(([t, l, tp, d]) => (
          <PieceSvg key={t} t={t} c="w" className="absolute w-48 h-48 opacity-[0.045]" style={{ left: l, top: tp, animation: `chessFloat 14s ease-in-out ${-d}s infinite` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-3 md:px-6">
        <header className="text-center mb-5 fade-in-up">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-white">Chess</span>
            <span className="ml-2 bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">Arena</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Click or drag to move · Esc to deselect · every capture shatters</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
          {/* Board column */}
          <div className="flex flex-col gap-2" style={{ width: boardPx + (boardPx >= 400 ? 22 : 0) }}>
            <div style={{ marginLeft: boardPx >= 400 ? 22 : 0 }}>{strip(top)}</div>
            <div className="flex gap-2.5 items-stretch">
              {boardPx >= 400 && (
                <div className="relative w-3 rounded-full overflow-hidden border border-white/10" title="Evaluation" style={{ background: orientation === "w" ? "#1b1712" : "#f3ead8" }}>
                  <div
                    className="absolute left-0 right-0"
                    style={{
                      background: orientation === "w" ? "linear-gradient(0deg,#fff,#e8dcc4)" : "linear-gradient(180deg,#2a2630,#0d0c10)",
                      height: `${orientation === "w" ? whiteShare : 100 - whiteShare}%`,
                      bottom: 0,
                      transition: "height 0.8s cubic-bezier(.16,1,.3,1)",
                    }}
                  />
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-amber-400/50" />
                </div>
              )}

              <div ref={stageRef} style={{ perspective: 1400 }}>
                <div ref={tiltRef} style={{ transformStyle: "preserve-3d" }}>
                  <div className={intro ? "chess-board-in" : ""}>
                    <div
                      ref={spinRef}
                      className={`relative select-none touch-none rounded-md ${canMove ? "chess-board-live" : ""} ${cine && cine.phase < 7 ? "overflow-hidden" : ""}`}
                      style={{
                        width: boardPx,
                        height: boardPx,
                        boxShadow: "0 0 0 3px #2a1f17, 0 0 0 5px rgba(245,200,107,0.55), 0 0 0 11px #17110c, 0 30px 80px rgba(0,0,0,0.65)",
                      }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={() => { drag.current = null; setDragSq(null); }}
                      role="grid"
                      aria-label="Chess board"
                    >
                      {/* Camera: everything on the board plane; zooms in for the checkmate scene */}
                      <div ref={cameraRef} className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
                      {/* Squares */}
                      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 rounded-md overflow-hidden" style={{ filter: cine && cine.phase < 6 ? "grayscale(0.75) brightness(0.6)" : "none", transition: "filter .8s ease" }}>
                        {Array.from({ length: 64 }, (_, d) => {
                          const sq = orientation === "w" ? d : 63 - d;
                          const r = sq >> 3, c = sq & 7;
                          const light = (r + c) % 2 === 0;
                          const tgt = targetSet.get(sq);
                          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                          const isHint = hint && (hint.from === sq || hint.to === sq);
                          const dist = selected !== null ? Math.hypot((sq & 7) - (selected & 7), (sq >> 3) - (selected >> 3)) : 0;
                          return (
                            <div
                              key={d}
                              data-sq={sq}
                              className={`chess-sq relative ${tgt ? "chess-target cursor-pointer" : ""}`}
                              style={{
                                background: light ? "#e3d3b5" : "#8a6a4e",
                                animation: intro ? `chessSqIn .55s cubic-bezier(.2,.8,.3,1) ${((d >> 3) + (d & 7)) * 32}ms both` : undefined,
                              }}
                              role="gridcell"
                              aria-label={`${"abcdefgh"[c]}${8 - r}`}
                            >
                              {isLast && <div className="absolute inset-0 bg-amber-300/30 pointer-events-none" style={{ animation: "chessFadeIn .4s ease-out both" }} />}
                              {isHint && <div className="absolute inset-0 bg-emerald-400/30 pointer-events-none" />}
                              {selected === sq && <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(255,214,102,0.5)", boxShadow: "inset 0 0 0 3px rgba(255,240,190,0.8)" }} />}
                              {selected === sq && <div className="absolute inset-[6%] rounded-full pointer-events-none chess-sel-ring" />}
                              {checkSq === sq && !cine && <div className="absolute inset-0 pointer-events-none chess-check" />}
                              {aiIntent === sq && <div className="absolute inset-0 pointer-events-none chess-intent" />}
                              {tgt && !tgt.captured && (
                                <div className="chess-dot absolute rounded-full pointer-events-none" style={{ inset: "37%", background: "rgba(25,18,10,0.38)", animation: `chessDotIn .3s cubic-bezier(.34,1.56,.64,1) ${dist * 30}ms both` }} />
                              )}
                              {tgt && tgt.captured && (
                                <div className="absolute inset-0 pointer-events-none chess-capture-ring" style={{ animation: `chessDotIn .3s cubic-bezier(.34,1.56,.64,1) ${dist * 30}ms both, chessRingPulse 1.4s ease-in-out infinite` }} />
                              )}
                              {(d & 7) === 0 && <span className="absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none" style={{ color: light ? "#8a6a4e" : "#e3d3b5" }}>{8 - r}</span>}
                              {d >> 3 === 7 && <span className="absolute bottom-0 right-1 text-[10px] font-bold pointer-events-none" style={{ color: light ? "#8a6a4e" : "#e3d3b5" }}>{"abcdefgh"[c]}</span>}
                            </div>
                          );
                        })}
                      </div>
                      {/* sheen over the wood */}
                      <div className="absolute inset-0 rounded-md pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 40%, rgba(0,0,0,0.12))" }} />

                      {/* Captured pieces waiting to shatter */}
                      {ghosts.map(g => (
                        <div key={g.key} className="absolute left-0 top-0 w-[12.5%] h-[12.5%] pointer-events-none z-[5]" style={{ transform: `translate(${(g.v & 7) * 100}%, ${(g.v >> 3) * 100}%)` }}>
                          <div className="w-full h-full" style={{ animation: g.fade ? "chessFadeOut .6s ease-in both" : `chessShatter .45s ease-in ${g.delay}ms both` }}>
                            <PieceSvg t={g.piece.t} c={g.piece.c} className="w-full h-full chess-piece-svg" />
                          </div>
                        </div>
                      ))}

                      {/* Pieces */}
                      {s.board.map((p, sq) => {
                        if (!p) return null;
                        const v = vOf(sq);
                        const lifted = selected === sq;
                        return (
                          <div
                            key={p.id}
                            ref={el => { if (el) pieceEls.current.set(p.id, el); else pieceEls.current.delete(p.id); }}
                            className="absolute left-0 top-0 w-[12.5%] h-[12.5%] pointer-events-none z-10"
                            style={{ transform: `translate(${(v & 7) * 100}%, ${(v >> 3) * 100}%)` }}
                          >
                            {(() => {
                              const fall = cine?.fallen?.[p.id];
                              const actor = cine && (p.id === cine.atkId || p.id === cine.kingId);
                              const dim = cine && cine.phase < 6 && !actor;
                              const gone = cine?.kingGone && p.id === cine.kingId;
                              return (
                                <div
                                  className="w-full h-full"
                                  style={{
                                    transformOrigin: "50% 88%",
                                    opacity: dragSq === sq ? 0.25 : gone ? 0 : fall ? 0.6 : 1,
                                    transform: fall ? `rotate(${fall.dir * 82}deg) translateY(8%)` : undefined,
                                    filter: fall ? "grayscale(1) brightness(0.45)" : dim ? "grayscale(0.85) brightness(0.5)" : undefined,
                                    transition: fall
                                      ? `transform .9s cubic-bezier(.55,0,.35,1.4) ${fall.delay}ms, filter .9s ${fall.delay}ms, opacity .9s ${fall.delay}ms`
                                      : "opacity .2s, filter .7s, transform .7s cubic-bezier(.34,1.56,.64,1)",
                                  }}
                                >
                                  <div
                                    className={`relative w-full h-full ${lifted && dragSq !== sq ? "chess-lift" : ""} ${aiIntent === sq ? "chess-intent-piece" : ""} ${cine && p.id === cine.atkId && cine.phase >= 3 && cine.phase <= 5 ? "chess-aura" : ""}`}
                                    style={cine && p.id === cine.atkId ? ({ ["--g" as string]: FINISHERS[cine.atkT].glow } as React.CSSProperties) : undefined}
                                  >
                                    <PieceSvg t={p.t} c={p.c} className="w-full h-full chess-piece-svg" />
                                    {cine && p.id === cine.kingId && cine.phase === 5 && !cine.kingGone && (
                                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,80,80,0.8))" }} aria-hidden="true">
                                        {CRACKS.map((d, i) => (
                                          <path key={i} d={d} fill="none" stroke="#fff" strokeWidth={i ? 2.2 : 3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" style={{ animation: `chessCrack .28s ease-out ${0.05 + i * 0.09}s forwards` }} />
                                        ))}
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}

                      {/* Hint arrow */}
                      {hint && (() => {
                        const a = vOf(hint.from), b = vOf(hint.to);
                        const x1 = (a & 7) + 0.5, y1 = (a >> 3) + 0.5, x2 = (b & 7) + 0.5, y2 = (b >> 3) + 0.5;
                        const len = Math.hypot(x2 - x1, y2 - y1);
                        const ex = x2 - ((x2 - x1) / len) * 0.3, ey = y2 - ((y2 - y1) / len) * 0.3;
                        return (
                          <svg viewBox="0 0 8 8" className="absolute inset-0 w-full h-full pointer-events-none z-20" aria-hidden="true">
                            <defs>
                              <marker id="chess-arrow" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
                                <path d="M0 0 L10 5 L0 10 Z" fill="rgba(74,222,128,0.95)" />
                              </marker>
                            </defs>
                            <line x1={x1} y1={y1} x2={ex} y2={ey} stroke="rgba(74,222,128,0.9)" strokeWidth="0.16" strokeLinecap="round" markerEnd="url(#chess-arrow)"
                              strokeDasharray={len} strokeDashoffset={len} style={{ animation: "chessDraw .5s ease-out forwards", filter: "drop-shadow(0 0 0.08px #4ade80)" }} />
                          </svg>
                        );
                      })()}

                      {/* Particles */}
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ width: boardPx, height: boardPx }} />

                      {/* Scan line while the computer thinks */}
                      {thinking && (
                        <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none z-20">
                          <div className="chess-scan" />
                        </div>
                      )}

                      {/* Promotion light beam */}
                      {beam !== null && (
                        <div className="absolute pointer-events-none z-30" style={{ left: `${(beam & 7) * 12.5}%`, width: "12.5%", top: 0, height: `${((beam >> 3) + 1) * 12.5}%`, transformOrigin: "50% 0", animation: "chessBeam 1.1s ease-out both", background: "linear-gradient(180deg, rgba(255,240,190,0), rgba(255,226,140,0.55) 60%, rgba(255,255,255,0.9))", filter: "blur(2px)" }} />
                      )}

                      {/* Mate spotlight */}
                      {spot !== null && (
                        <div className="absolute inset-0 rounded-md pointer-events-none z-[25]" style={{
                          background: `radial-gradient(circle at ${((spot & 7) + 0.5) * 12.5}% ${((spot >> 3) + 0.5) * 12.5}%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 8%, rgba(0,0,0,0.7) 24%)`,
                          animation: "chessFadeIn .9s ease-out both",
                        }} />
                      )}

                      {/* Light trail of the last move */}
                      {lastMove && !cine && (() => {
                        const pts = pathPoints(vOf(lastMove.from), vOf(lastMove.to), lastMove.piece.t);
                        const a = pts[0], b = pts[pts.length - 1];
                        const len = pathLen(pts);
                        return (
                          <svg key={`trail-${hist.length}`} viewBox="0 0 8 8" className="absolute inset-0 w-full h-full pointer-events-none z-[6]" aria-hidden="true">
                            <defs>
                              <linearGradient id="chess-trail-g" gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
                                <stop offset="0" stopColor="rgba(255,214,102,0)" /><stop offset="1" stopColor="rgba(255,236,170,0.95)" />
                              </linearGradient>
                            </defs>
                            <polyline points={ptsAttr(pts)} fill="none" stroke="url(#chess-trail-g)" strokeWidth="0.2" strokeLinecap="round" strokeLinejoin="round"
                              strokeDasharray={len} style={{ ["--len" as string]: len, animation: "chessTrail 1.2s ease-out both" } as React.CSSProperties} />
                          </svg>
                        );
                      })()}

                      {/* Check laser: the line of attack onto the king */}
                      {checkSq !== null && !cine && attackersOf(s.board, checkSq, other(s.turn)).map(a => {
                        const pts = pathPoints(vOf(a), vOf(checkSq), s.board[a]!.t);
                        return (
                          <svg key={`laser-${a}-${hist.length}`} viewBox="0 0 8 8" className="absolute inset-0 w-full h-full pointer-events-none z-[26]" aria-hidden="true"
                            style={{ filter: "drop-shadow(0 0 4px rgba(255,40,70,0.9))", animation: "chessFadeIn .4s ease-out .45s both" }}>
                            <polyline points={ptsAttr(pts)} fill="none" stroke="rgba(255,60,80,0.3)" strokeWidth="0.24" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points={ptsAttr(pts)} fill="none" stroke="rgba(255,150,160,0.95)" strokeWidth="0.06" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.2 0.14" style={{ animation: "chessLaserFlow .5s linear infinite" }} />
                          </svg>
                        );
                      })}

                      {/* Checkmate scene: twin spotlight on attacker and king */}
                      {cine && cine.phase < 6 && (() => {
                        const pos = (v: number) => `${((v & 7) + 0.5) * 12.5}% ${((v >> 3) + 0.5) * 12.5}%`;
                        const m = `radial-gradient(circle at ${pos(cine.aV)}, transparent 0 5.5%, #000 12%), radial-gradient(circle at ${pos(cine.kV)}, transparent 0 5.5%, #000 12%)`;
                        return <div className="absolute inset-0 pointer-events-none z-[24]" style={{ background: "rgba(0,0,0,0.5)", maskImage: m, WebkitMaskImage: m, maskComposite: "intersect", WebkitMaskComposite: "source-in", animation: "chessFadeIn .8s both" }} />;
                      })()}

                      {/* Checkmate scene: the line of attack charges up (lightning for the queen, a lance for the bishop) */}
                      {cine && cine.phase >= 3 && cine.phase <= 5 && (() => {
                        const fin = FINISHERS[cine.atkT];
                        const len = pathLen(cine.path);
                        return (
                          <svg viewBox="0 0 8 8" className="absolute inset-0 w-full h-full pointer-events-none z-[28]" aria-hidden="true"
                            style={{ filter: `drop-shadow(0 0 6px rgba(${fin.glow},0.95))`, animation: cine.phase === 5 ? "chessFadeOutQuick .7s ease-out .25s both" : undefined }}>
                            {cine.atkT === "b" && <polyline points={ptsAttr(cine.path)} fill="none" stroke={`rgba(${fin.glow},0.35)`} strokeWidth="0.6" strokeLinecap="round" style={{ animation: "chessBeamPulse .22s ease-in-out infinite alternate" }} />}
                            <polyline points={ptsAttr(cine.path)} fill="none" stroke={`rgba(${fin.glow},0.95)`} strokeWidth={cine.atkT === "b" ? 0.16 : 0.08} strokeLinecap="round" strokeLinejoin="round"
                              strokeDasharray={len} style={{ ["--len" as string]: len, animation: "chessDrawLen .55s ease-out both" } as React.CSSProperties} />
                            {cine.bolts.map((b, i) => (
                              <polyline key={i} points={b} fill="none" stroke={i ? "#ffffff" : "#fef08a"} strokeWidth={i ? 0.035 : 0.065} strokeLinejoin="bevel" style={{ animation: `chessBolt .14s steps(2) ${i * 0.07}s infinite` }} />
                            ))}
                          </svg>
                        );
                      })()}

                      {/* Checkmate scene: a phantom of the attacker strikes the king, with afterimages */}
                      {cine && cine.phase === 4 && (() => {
                        const fin = FINISHERS[cine.atkT];
                        const pts = cine.path, p0 = pts[0], pl = pts[pts.length - 1];
                        const pm = pts.length === 3 ? pts[1] : { x: (p0.x + pl.x) / 2, y: (p0.y + pl.y) / 2 };
                        const prev = pts.length === 3 ? pts[1] : p0;
                        const dl = Math.hypot(pl.x - prev.x, pl.y - prev.y) || 1;
                        const end = { x: pl.x - ((pl.x - prev.x) / dl) * 0.3, y: pl.y - ((pl.y - prev.y) / dl) * 0.3 };
                        const pc = (v: number) => `${(v - 0.5) * 100}%`;
                        const vars = { "--x0": pc(p0.x), "--y0": pc(p0.y), "--xm": pc(pm.x), "--ym": pc(pm.y), "--x1": pc(end.x), "--y1": pc(end.y), "--lift": cine.atkT === "n" ? "-70%" : "-14%" };
                        return [3, 2, 1, 0].map(i => (
                          <div key={i} className="absolute left-0 top-0 w-[12.5%] h-[12.5%] pointer-events-none z-[34]"
                            style={{ ...vars, ["--o" as string]: 1 - i * 0.24, animation: `chessPhantom .36s cubic-bezier(.55,0,.85,.4) ${i * 40}ms both`, filter: `brightness(${1.7 - i * 0.15}) drop-shadow(0 0 ${9 - i * 2}px rgba(${fin.glow},0.95))` } as React.CSSProperties}>
                            <PieceSvg t={cine.atkT} c={cine.atkC} className="w-full h-full" />
                          </div>
                        ));
                      })()}

                      {/* Checkmate scene: the crown flies off and clatters across the board */}
                      {cine?.crown && (() => {
                        const kc = cine.kV & 7;
                        const dir = kc >= 6 ? -1 : kc <= 1 ? 1 : kc >= (cine.aV & 7) ? 1 : -1;
                        return (
                          <div className="absolute left-0 top-0 w-[12.5%] h-[12.5%] pointer-events-none z-[31]" style={{ transform: `translate(${(cine.kV & 7) * 100}%, ${(cine.kV >> 3) * 100}%)` }}>
                            <div className="absolute" style={{ left: "22%", top: "2%", width: "56%", height: "56%", ["--dir" as string]: dir, animation: "chessCrownFly 1.7s cubic-bezier(.3,.1,.3,1) forwards", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.6))" } as React.CSSProperties}>
                              <CrownSvg />
                            </div>
                          </div>
                        );
                      })()}
                      </div>
                      {/* end camera */}

                      {/* Checkmate scene overlays (not zoomed): cinema bars, speed lines, title card, flash */}
                      {cine && (() => {
                        const fin = FINISHERS[cine.atkT];
                        const Q = boardPx / 8, C = boardPx / 2;
                        const ksx = C + cine.cam.s * (((cine.kV & 7) + 0.5) * Q - C) + cine.cam.tx;
                        const ksy = C + cine.cam.s * (((cine.kV >> 3) + 0.5) * Q - C) + cine.cam.ty;
                        const barAnim = cine.phase < 6 ? "chessBarIn .7s cubic-bezier(.7,0,.3,1) both" : "chessBarOut .7s cubic-bezier(.7,0,.3,1) both";
                        const winnerName = mode === "ai" ? (cine.winner === playerColor ? "You win" : "The computer wins") : `${cine.winner === "w" ? "White" : "Black"} wins`;
                        return (
                          <>
                            {(cine.phase === 3 || cine.phase === 4) && (
                              <div className="absolute pointer-events-none z-[43]" style={{
                                left: ksx, top: ksy, width: boardPx * 2.4, height: boardPx * 2.4,
                                background: `repeating-conic-gradient(from 0deg, rgba(${fin.glow},0.16) 0deg 1.1deg, transparent 1.1deg 6.5deg)`,
                                maskImage: "radial-gradient(circle, transparent 0 10%, #000 34%)", WebkitMaskImage: "radial-gradient(circle, transparent 0 10%, #000 34%)",
                                animation: "chessSpeed .24s steps(3) infinite",
                              }} />
                            )}
                            <div className="absolute left-0 right-0 top-0 z-[44] bg-black pointer-events-none" style={{ height: "10%", transformOrigin: "top", animation: barAnim }} />
                            <div className="absolute left-0 right-0 bottom-0 z-[44] bg-black pointer-events-none flex items-center justify-center" style={{ height: "10%", transformOrigin: "bottom", animation: barAnim }}>
                              <span className="text-white/70 tracking-[0.25em] uppercase font-semibold" style={{ fontSize: Math.max(9, boardPx * 0.022), animation: "chessFadeIn .6s ease-out .8s both" }}>
                                {cine.atkC === "w" ? "White" : "Black"} {PIECE_NAME[cine.atkT]} · {cine.san}
                              </span>
                            </div>
                            {cine.phase >= 2 && cine.phase <= 5 && (
                              <div className="absolute left-0 right-0 z-[46] pointer-events-none flex flex-col items-start" style={{ top: "13%", padding: "0 6%", animation: cine.phase >= 4 ? "chessCardOut .45s cubic-bezier(.7,0,.8,.4) both" : "chessCardIn .6s cubic-bezier(.16,1,.3,1) both" }}>
                                <span className="font-bold uppercase" style={{ fontSize: Math.max(9, boardPx * 0.02), letterSpacing: "0.5em", color: `rgb(${fin.glow})` }}>Finisher</span>
                                <span className="font-display font-black italic leading-none" style={{ fontSize: boardPx * 0.085, color: "#fff", textShadow: `0 0 18px rgba(${fin.glow},0.9), 3px 3px 0 rgba(0,0,0,0.6)` }}>{fin.name}</span>
                                <span className="mt-1 text-white/80" style={{ fontSize: Math.max(11, boardPx * 0.026), textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>{fin.tagline}</span>
                                <span className="mt-2 h-[2px] w-3/5" style={{ background: `linear-gradient(90deg, rgb(${fin.glow}), transparent)`, transformOrigin: "left", animation: "chessUnderline .7s ease-out .2s both" }} />
                              </div>
                            )}
                            {cine.phase === 5 && <div className="absolute inset-0 z-[47] pointer-events-none bg-white" style={{ animation: "chessFlash .6s ease-out both" }} />}
                            {cine.phase === 6 && (
                              <div className="absolute inset-0 z-[46] flex flex-col items-center justify-center pointer-events-none">
                                <p className="font-display font-black" style={{ fontSize: boardPx * 0.105, letterSpacing: "0.1em" }}>
                                  {"CHECKMATE".split("").map((ch, i) => (
                                    <span key={i} className="inline-block bg-gradient-to-b from-amber-100 to-amber-400 bg-clip-text text-transparent" style={{ animation: `chessLetterSlam .5s cubic-bezier(.2,1.5,.4,1) ${i * 0.06}s both`, filter: "drop-shadow(0 4px 0 rgba(0,0,0,0.6))" }}>{ch}</span>
                                  ))}
                                </p>
                                <p className="text-white font-semibold" style={{ fontSize: Math.max(12, boardPx * 0.032), textShadow: "0 2px 8px rgba(0,0,0,0.9)", animation: "chessFadeIn .6s ease-out .7s both" }}>{winnerName} · {fin.name}</p>
                              </div>
                            )}
                            {cine.phase < 6 && (
                              <button type="button" onPointerDown={e => e.stopPropagation()} onClick={skipCine}
                                className="absolute top-1.5 right-2 z-[48] px-2.5 py-1 rounded-md text-[11px] font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                                style={{ animation: "chessFadeIn .4s ease-out 1s both" }}>
                                Skip ›
                              </button>
                            )}
                          </>
                        );
                      })()}

                      {/* CHECK banner */}
                      {banner !== null && (
                        <div key={banner} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                          <p className="font-display font-black tracking-[0.18em] text-rose-400" style={{ fontSize: boardPx * 0.13, textShadow: "0 0 24px rgba(244,63,94,0.8), 0 4px 0 rgba(0,0,0,0.5)", animation: "chessSlam 1.2s cubic-bezier(.2,1.4,.4,1) both" }}>
                            CHECK!
                          </p>
                        </div>
                      )}

                      {/* Promotion picker */}
                      {promo && (
                        <div className="absolute inset-0 z-50" onPointerDown={e => { e.stopPropagation(); setPromo(null); }}>
                          <div className="absolute inset-0 bg-black/50 rounded-md" style={{ animation: "chessFadeIn .2s both" }} />
                          {(["q", "r", "b", "n"] as PieceType[]).map((t, i) => {
                            const v = vOf(promo.to);
                            const fromTop = v >> 3 === 0;
                            const row = fromTop ? i : 7 - i;
                            return (
                              <button
                                key={t}
                                type="button"
                                aria-label={`Promote to ${t}`}
                                onPointerDown={e => { e.stopPropagation(); choosePromo(t); }}
                                className="absolute rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                style={{
                                  left: `${(v & 7) * 12.5}%`, top: `${row * 12.5}%`, width: "12.5%", height: "12.5%",
                                  background: "radial-gradient(circle, rgba(255,226,140,0.45), rgba(40,30,20,0.9) 70%)",
                                  boxShadow: "0 0 0 2px rgba(245,200,107,0.7), 0 0 24px rgba(245,200,107,0.5)",
                                  animation: `chessPromoIn .4s cubic-bezier(.34,1.56,.64,1) ${i * 70}ms both`,
                                }}
                              >
                                <PieceSvg t={t} c={s.turn} className="w-[85%] h-[85%]" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Result */}
                      {showResult && resultText && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center rounded-md bg-black/45 backdrop-blur-[2px]" onPointerDown={e => e.stopPropagation()} style={{ animation: "chessFadeIn .5s both" }}>
                          <div className="text-center px-6 py-6 rounded-2xl border border-amber-300/30 bg-[rgba(18,14,10,0.85)] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(245,200,107,0.15)]" style={{ animation: "chessCard .6s cubic-bezier(.34,1.56,.64,1) both" }}>
                            <Crown className="mx-auto text-amber-300 mb-2" size={34} style={{ animation: "chessCrown 1s cubic-bezier(.34,1.56,.64,1) .2s both" }} />
                            <p className="font-display font-black tracking-[0.14em] text-2xl md:text-3xl">
                              {resultText.title.split("").map((ch, i) => (
                                <span key={i} className="inline-block bg-gradient-to-b from-amber-100 to-amber-400 bg-clip-text text-transparent" style={{ animation: `chessLetter .5s cubic-bezier(.34,1.56,.64,1) ${0.25 + i * 0.05}s both` }}>{ch}</span>
                              ))}
                            </p>
                            <p className="text-white/80 text-sm mt-2">{resultText.sub}</p>
                            <p className="text-white/35 text-[11px] mt-1">{Math.ceil(sans.length / 2)} moves</p>
                            <div className="flex gap-2 justify-center mt-4">
                              <button type="button" onClick={() => newGame()} className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-900 bg-gradient-to-r from-amber-200 to-amber-400 hover:scale-105 active:scale-95 transition-transform">Play again</button>
                              <button type="button" onClick={() => setShowResult(false)} className="px-4 py-2 rounded-lg text-sm text-white/70 border border-white/15 hover:text-white">View board</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginLeft: boardPx >= 400 ? 22 : 0 }}>{strip(bottom)}</div>
          </div>

          {/* Side panel */}
          <aside className="w-full max-w-[420px] lg:w-72 flex flex-col gap-3 fade-in-up delay-200" style={{ opacity: 0 }}>
            <div className="rounded-xl px-4 py-3 border border-white/10 bg-white/[0.03]" aria-live="polite">
              <p key={status} className="text-sm font-semibold" style={{ animation: "chessFadeIn .3s both", color: checkSq !== null && !outcomeNow ? "#fb7185" : undefined }}>{status}</p>
              {aiInfo && mode === "ai" && <p className="text-[10px] text-white/35 mt-0.5">Computer looked {aiInfo.depth} moves ahead · {aiInfo.nodes.toLocaleString()} positions</p>}
            </div>

            <Seg<Mode> value={mode} onChange={m => { setMode(m); newGame({ mode: m }); }} options={[{ v: "ai", label: "vs Computer", icon: Bot }, { v: "local", label: "2 Players", icon: Users }]} />
            {mode === "ai" && (
              <>
                <Seg<Level> value={level} onChange={setLevel} options={[{ v: "easy", label: "Easy" }, { v: "medium", label: "Medium" }, { v: "hard", label: "Hard" }]} />
                <Seg<Color> value={playerColor} onChange={c => { setPlayerColor(c); newGame({ player: c }); }} options={[{ v: "w", label: "Play White" }, { v: "b", label: "Play Black" }]} />
              </>
            )}

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: "New", icon: RotateCcw, run: () => newGame(), disabled: false },
                { label: "Undo", icon: Undo2, run: undo, disabled: hist.length <= 1 || (mode === "ai" && thinking && hist.length <= 2) },
                { label: "Flip", icon: ArrowUpDown, run: flip, disabled: !!cine && cine.phase < 7 },
                { label: hintBusy ? "…" : "Hint", icon: Lightbulb, run: askHint, disabled: !canMove || hintBusy },
                { label: soundOn ? "Sound" : "Muted", icon: soundOn ? Volume2 : VolumeX, run: () => setSoundOn(v => !v), disabled: false },
              ].map(b => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => { ensure(); b.run(); }}
                  disabled={b.disabled}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-amber-200 hover:border-amber-300/40 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                >
                  <b.icon size={15} />
                  <span className="text-[10px]">{b.label}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/35">Moves</p>
              <div ref={movesRef} className="max-h-48 lg:max-h-[300px] overflow-y-auto px-2 pb-3 text-[13px] font-mono">
                {sans.length === 0 && <p className="px-2 py-2 text-white/30 text-xs font-sans">No moves yet. {mode === "ai" && playerColor === "w" ? "You play White, go first." : ""}</p>}
                {Array.from({ length: Math.ceil(sans.length / 2) }, (_, i) => (
                  <div key={i} className="grid grid-cols-[2.2rem_1fr_1fr] items-center rounded-md px-2 py-0.5 odd:bg-white/[0.02]">
                    <span className="text-white/30">{i + 1}.</span>
                    {[sans[2 * i], sans[2 * i + 1]].map((m, j) => m && (
                      <span key={j} className={2 * i + j === sans.length - 1 ? "text-amber-200 font-bold" : "text-white/75"} style={2 * i + j === sans.length - 1 ? { animation: "chessPop .35s cubic-bezier(.34,1.56,.64,1) both" } : undefined}>{m}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Piece following the pointer while dragging (portalled: a transformed ancestor would offset "fixed") */}
      {dragSq !== null && s.board[dragSq] && createPortal(
        <div ref={ghostRef} className="fixed left-0 top-0 z-[70] pointer-events-none" style={{ width: q * 1.3, height: q * 1.3, transform: `translate(${-9999}px, 0)`, transition: "transform 0.04s linear" }}>
          <PieceSvg t={s.board[dragSq]!.t} c={s.board[dragSq]!.c} className="w-full h-full" style={{ filter: "drop-shadow(0 18px 14px rgba(0,0,0,0.55))" }} />
        </div>,
        document.body,
      )}

      {createPortal(<Fireworks run={fireworks} />, document.body)}
      {souls.length > 0 && createPortal(
        <>
          {souls.map(sl => (
            <div key={sl.key} className="fixed left-0 top-0 z-[75] pointer-events-none"
              style={{ ["--x0" as string]: `${sl.x0}px`, ["--y0" as string]: `${sl.y0}px`, ["--x1" as string]: `${sl.x1}px`, ["--y1" as string]: `${sl.y1}px`, animation: "chessSoul .75s cubic-bezier(.5,0,.3,1) both" } as React.CSSProperties}>
              <span className="block w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full" style={{ background: `radial-gradient(circle, #fff, rgba(${sl.color},0.95) 45%, rgba(${sl.color},0) 72%)`, boxShadow: `0 0 16px 5px rgba(${sl.color},0.65)` }} />
            </div>
          ))}
        </>,
        document.body,
      )}

      <style>{`
        .chess-piece-svg { filter: drop-shadow(0 3px 2px rgba(0,0,0,0.45)); }
        .chess-lift { animation: chessLift 1.6s ease-in-out infinite; }
        @keyframes chessLift { 0%,100% { transform: translateY(-9%) scale(1.12); } 50% { transform: translateY(-14%) scale(1.12); } }
        .chess-intent-piece { animation: chessIntentPiece .42s ease-in-out both; }
        @keyframes chessIntentPiece { 0% { filter: none; } 50% { filter: drop-shadow(0 0 10px rgba(103,232,249,0.95)) brightness(1.25); transform: translateY(-6%); } 100% { filter: drop-shadow(0 0 6px rgba(103,232,249,0.7)); } }
        .chess-intent { background: radial-gradient(circle, rgba(103,232,249,0.55), rgba(103,232,249,0) 70%); animation: chessFadeIn .2s both; }
        .chess-check { background: radial-gradient(circle, rgba(255,40,60,0.85) 0%, rgba(255,40,60,0.35) 45%, rgba(255,40,60,0) 75%); animation: chessCheck 1s ease-in-out infinite; }
        @keyframes chessCheck { 0%,100% { opacity: 0.75; } 50% { opacity: 1; } }
        .chess-capture-ring { background: radial-gradient(circle, transparent 0 58%, rgba(25,18,10,0.45) 60% 72%, transparent 74%); }
        @keyframes chessRingPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(0.92); } }
        .chess-target:hover .chess-dot { inset: 30% !important; background: rgba(25,18,10,0.5) !important; }
        .chess-target:hover { box-shadow: inset 0 0 0 3px rgba(255,214,102,0.6); }
        .chess-board-live::after { content: ""; position: absolute; inset: -6px; border-radius: 10px; pointer-events: none; box-shadow: 0 0 0 2px rgba(245,200,107,0.6), 0 0 50px rgba(245,200,107,0.3); animation: chessLive 2.6s ease-in-out infinite; }
        @keyframes chessLive { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        .chess-scan { position: absolute; left: 0; right: 0; height: 30%; background: linear-gradient(180deg, rgba(103,232,249,0), rgba(103,232,249,0.22) 85%, rgba(165,243,252,0.6)); animation: chessScan 1.3s cubic-bezier(.45,0,.55,1) infinite; }
        @keyframes chessScan { from { transform: translateY(-100%); } to { transform: translateY(340%); } }
        .chess-dots i { display: inline-block; width: 3px; height: 3px; margin-left: 2px; border-radius: 50%; background: currentColor; animation: chessDot 1s infinite; }
        .chess-dots i:nth-child(2) { animation-delay: .15s; } .chess-dots i:nth-child(3) { animation-delay: .3s; }
        @keyframes chessDot { 0%,100% { opacity: .2; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
        .chess-board-in { animation: chessBoardIn 1.1s cubic-bezier(.16,1,.3,1) both; transform-origin: 50% 80%; }
        @keyframes chessBoardIn { from { opacity: 0; transform: rotateX(62deg) translateY(60px) scale(0.78); } to { opacity: 1; transform: none; } }
        @keyframes chessSqIn { from { opacity: 0; transform: rotateX(-90deg) scale(0.6); } to { opacity: 1; transform: none; } }
        @keyframes chessDotIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
        @keyframes chessShatter { 0% { opacity: 1; transform: scale(1); filter: none; } 30% { opacity: 1; transform: scale(1.25) rotate(-8deg); filter: brightness(2.2); } 100% { opacity: 0; transform: scale(1.6) rotate(18deg); filter: brightness(3) blur(6px); } }
        @keyframes chessFadeOut { to { opacity: 0; transform: scale(0.6); filter: blur(4px); } }
        @keyframes chessFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes chessSlam { 0% { opacity: 0; transform: scale(2.6); } 18% { opacity: 1; transform: scale(0.94); } 28% { transform: scale(1); } 75% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.1); } }
        @keyframes chessBeam { 0% { opacity: 0; transform: scaleY(0); } 25% { opacity: 1; transform: scaleY(1); } 70% { opacity: 0.8; } 100% { opacity: 0; transform: scaleY(1); } }
        @keyframes chessPromoIn { from { opacity: 0; transform: scale(0) rotate(-90deg); } to { opacity: 1; transform: none; } }
        @keyframes chessPop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: none; } }
        @keyframes chessDraw { to { stroke-dashoffset: 0; } }
        @keyframes chessCard { from { opacity: 0; transform: translateY(20px) scale(0.85); } to { opacity: 1; transform: none; } }
        @keyframes chessCrown { from { opacity: 0; transform: translateY(-30px) rotate(-30deg) scale(0.4); } to { opacity: 1; transform: none; } }
        @keyframes chessLetter { from { opacity: 0; transform: translateY(-24px) scale(1.6); } to { opacity: 1; transform: none; } }
        @keyframes chessTurnRing { 0% { opacity: 0.9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
        .chess-sel-ring { border: 2px solid rgba(255,236,170,0.9); animation: chessSelRing 1.2s ease-out infinite; }
        @keyframes chessSelRing { 0% { opacity: 0.9; transform: scale(0.7); } 100% { opacity: 0; transform: scale(1.25); } }
        .chess-aura { animation: chessAura .45s ease-in-out infinite alternate; }
        @keyframes chessAura { from { filter: drop-shadow(0 0 4px rgba(var(--g),0.8)) brightness(1.1); transform: translateY(-4%) scale(1.06); } to { filter: drop-shadow(0 0 16px rgba(var(--g),1)) brightness(1.4); transform: translateY(-10%) scale(1.14); } }
        @keyframes chessTrail { 0% { stroke-dashoffset: var(--len); opacity: 0.9; } 35% { stroke-dashoffset: 0; opacity: 0.75; } 100% { stroke-dashoffset: 0; opacity: 0; } }
        @keyframes chessLaserFlow { to { stroke-dashoffset: -0.34; } }
        @keyframes chessDrawLen { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }
        @keyframes chessBolt { 0% { opacity: 1; } 50% { opacity: 0.15; } 100% { opacity: 1; } }
        @keyframes chessBeamPulse { from { opacity: 0.5; } to { opacity: 1; } }
        @keyframes chessFadeOutQuick { to { opacity: 0; } }
        @keyframes chessPhantom {
          0% { transform: translate(var(--x0), var(--y0)) translateY(0%) scale(1.05); opacity: var(--o); }
          55% { transform: translate(var(--xm), var(--ym)) translateY(var(--lift)) scale(1.22); opacity: var(--o); }
          92% { transform: translate(var(--x1), var(--y1)) translateY(0%) scale(1.32); opacity: var(--o); }
          100% { transform: translate(var(--x1), var(--y1)) translateY(0%) scale(1.4); opacity: 0; }
        }
        @keyframes chessCrack { to { stroke-dashoffset: 0; } }
        @keyframes chessCrownFly {
          0% { transform: translate(0, 10%) rotate(0deg) scale(0.7); opacity: 0; }
          6% { transform: translate(0, -25%) rotate(0deg) scale(1); opacity: 1; }
          38% { transform: translate(calc(var(--dir) * 90%), -330%) rotate(calc(var(--dir) * 380deg)) scale(1.15); }
          68% { transform: translate(calc(var(--dir) * 170%), 70%) rotate(calc(var(--dir) * 600deg)) scale(1); }
          80% { transform: translate(calc(var(--dir) * 200%), 15%) rotate(calc(var(--dir) * 650deg)); }
          90% { transform: translate(calc(var(--dir) * 222%), 70%) rotate(calc(var(--dir) * 700deg)); }
          95% { transform: translate(calc(var(--dir) * 229%), 58%) rotate(calc(var(--dir) * 712deg)); }
          100% { transform: translate(calc(var(--dir) * 233%), 70%) rotate(calc(var(--dir) * 736deg)); opacity: 1; }
        }
        @keyframes chessBarIn { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes chessBarOut { from { transform: scaleY(1); } to { transform: scaleY(0); } }
        @keyframes chessSpeed { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); } 33% { transform: translate(-50%, -50%) rotate(2deg) scale(1.04); } 66% { transform: translate(-50%, -50%) rotate(-1.5deg) scale(0.98); } 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); } }
        @keyframes chessCardIn { from { opacity: 0; transform: translateX(-60px) skewX(-12deg); } to { opacity: 1; transform: none; } }
        @keyframes chessCardOut { to { opacity: 0; transform: translateX(80px) skewX(12deg); } }
        @keyframes chessUnderline { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes chessFlash { 0% { opacity: 0.9; } 100% { opacity: 0; } }
        @keyframes chessLetterSlam { 0% { opacity: 0; transform: translateY(-40px) scale(2.2); } 100% { opacity: 1; transform: none; } }
        @keyframes chessSoul {
          0% { transform: translate(var(--x0), var(--y0)) scale(0.3); opacity: 0; }
          15% { transform: translate(var(--x0), calc(var(--y0) - 10px)) scale(1.3); opacity: 1; }
          55% { transform: translate(calc((var(--x0) + var(--x1)) / 2), calc((var(--y0) + var(--y1)) / 2 - 80px)) scale(1); opacity: 1; }
          100% { transform: translate(var(--x1), var(--y1)) scale(0.5); opacity: 0.2; }
        }
        @keyframes chessFloat { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-30px) rotate(6deg); } }
      `}</style>
    </section>
  );
};

export default ChessGame;
