import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Bot, Crown, Lightbulb, RotateCcw, Undo2, Users, Volume2, VolumeX } from "lucide-react";
import {
  START_FEN, MATE_SCORE, VALUE, evaluate, findKing, inCheck, legalMoves, makeMove, other, outcome, parseFEN,
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
type SoundKind = "move" | "capture" | "castle" | "check" | "promote" | "win" | "lose" | "draw" | "select" | "whoosh" | "thud";

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
      const dt = Math.min(0.05, (t - prev) / 1000); prev = t;
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
      later(() => { shatter(vOf(m.capSq), cap.c, VALUE[cap.t] >= 500); shake(VALUE[cap.t] >= 500 ? 7 : 3); }, fly);
      later(() => setGhosts(g => g.filter(x => x.key !== key)), fly + 700);
    } else {
      later(() => dust(vTo), fly);
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

  /* ---------- game over sequence ---------- */
  const pieceEls = useRef(new Map<number, HTMLDivElement>());
  useEffect(() => {
    if (!over) return;
    const st = stateRef.current;
    if (over.kind !== "checkmate") {
      play("draw");
      later(() => setShowResult(true), 700);
      return;
    }
    const loser = other(over.winner);
    const k = findKing(st.board, loser);
    const king = st.board[k];
    const playerWon = mode === "local" || over.winner === playerColor;
    setSpot(vOf(k));
    if (!reduceMotion() && king) {
      const inner = pieceEls.current.get(king.id)?.firstElementChild as HTMLElement | undefined;
      inner?.animate(
        [{ transform: "rotate(0deg)" }, { offset: 0.3, transform: "rotate(10deg)" }, { offset: 0.75, transform: "rotate(-98deg) translateY(10%)" }, { transform: "rotate(-90deg) translateY(8%)" }],
        { duration: 1100, delay: 300, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" },
      );
      later(() => { shatter(vOf(k), loser, true); shatter(vOf(k), loser, true); shake(10); play("thud"); }, 1400);
      st.board.forEach((p, sq) => {
        if (!p || p.c !== over.winner) return;
        const v = vOf(sq);
        (pieceEls.current.get(p.id)?.firstElementChild as HTMLElement | undefined)?.animate(
          [{ transform: "translateY(0)" }, { offset: 0.4, transform: "translateY(-28%) scale(1.1)" }, { offset: 0.7, transform: "translateY(0) scale(1.06,0.94)" }, { transform: "translateY(0)" }],
          { duration: 650, delay: 1500 + ((v >> 3) + (v & 7)) * 50, easing: "ease-out" },
        );
      });
    }
    later(() => { if (playerWon) setFireworks(f => f + 1); play(playerWon ? "win" : "lose"); }, 1500);
    later(() => setShowResult(true), 2100);
    if (mode === "ai" && over.winner === playerColor) {
      unlock("chess-win");
      if (level === "hard") unlock("grandmaster");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.body.dataset.palette === "open") return;
      if (e.key === "Escape") { setSelected(null); setPromo(null); }
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
          <div className="flex items-center h-4 -space-x-1.5">
            {capturedBy[side].map((t, i) => (
              <PieceSvg key={i} t={t} c={other(side)} className="w-4 h-4" style={{ animation: "chessPop .45s cubic-bezier(.34,1.56,.64,1) both" }} />
            ))}
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
                      className={`relative select-none touch-none rounded-md ${canMove ? "chess-board-live" : ""}`}
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
                      {/* Squares */}
                      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 rounded-md overflow-hidden">
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
                              {checkSq === sq && <div className="absolute inset-0 pointer-events-none chess-check" />}
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
                            <div className="w-full h-full" style={{ transformOrigin: "50% 88%", opacity: dragSq === sq ? 0.25 : 1, transition: "opacity .15s" }}>
                              <div className={`w-full h-full ${lifted && dragSq !== sq ? "chess-lift" : ""} ${aiIntent === sq ? "chess-intent-piece" : ""}`}>
                                <PieceSvg t={p.t} c={p.c} className="w-full h-full chess-piece-svg" />
                              </div>
                            </div>
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
                { label: "Flip", icon: ArrowUpDown, run: flip, disabled: false },
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

      {/* Piece following the pointer while dragging */}
      {dragSq !== null && s.board[dragSq] && (
        <div ref={ghostRef} className="fixed left-0 top-0 z-[70] pointer-events-none" style={{ width: q * 1.3, height: q * 1.3, transform: `translate(${-9999}px, 0)`, transition: "transform 0.04s linear" }}>
          <PieceSvg t={s.board[dragSq]!.t} c={s.board[dragSq]!.c} className="w-full h-full" style={{ filter: "drop-shadow(0 18px 14px rgba(0,0,0,0.55))" }} />
        </div>
      )}

      <Fireworks run={fireworks} />

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
        @keyframes chessFloat { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-30px) rotate(6deg); } }
      `}</style>
    </section>
  );
};

export default ChessGame;
