import { useState, useEffect, useCallback, useRef } from "react";
import { unlock } from "@/lib/siteEvents";
import { RotateCcw, Star, Timer, Trophy } from "lucide-react";

/*
 * Memory Match with real 3D cards: cards are dealt in, flip on a true 3D axis,
 * matched pairs pop with a burst, wrong pairs shake, and a win ends in confetti
 * with a star rating. Timer, move counter and a saved best.
 */

const CARD_EMOJIS = ["🌈", "🔥", "💎", "👑", "⚡", "🎭", "🌊", "🦋"];
const BEST_KEY = "yw-memory-best";

const SAVAGE_WIN_MSGS = [
  "Took you long enough... my WiFi loaded faster 🐌",
  "Congrats! You have the memory of a... wait, what was I saying? 🧠",
  "You won but at what cost? {moves} moves of pure suffering 😩",
  "Even a goldfish would've done it in fewer moves 🐠",
  "Victory! Your brain cell (singular) is celebrating 🎉",
  "GG... but also, {moves} moves? Really? 💀",
  "You matched emojis. Your parents must be SO proud 👏",
];
const PERFECT_WIN_MSGS = [
  "Okay who told you where the cards were? 🤨",
  "{moves} moves?! Fine. You're actually good. Don't tell anyone. 🫣",
];
const SAVAGE_MISMATCH_MSGS = [
  "Were you even looking? 👀",
  "That wasn't it, chief 🚫",
  "Your memory is giving amnesia 🧠💨",
  "Bro just guessing at this point 🎲",
  "Those two don't even look alike 😭",
  "Wrong. Again. Shocking. 🤯",
  "The cards are SCREAMING at you rn 🗣️",
  "Did you close your eyes? Be honest 😴",
  "Pain. Agony, even. 💀",
];

interface Card { id: number; emoji: string; isFlipped: boolean; isMatched: boolean }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const starsFor = (moves: number) => (moves <= 12 ? 3 : moves <= 18 ? 2 : 1);

const Confetti = () => {
  const pieces = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.8 + Math.random() * 1.4,
      color: ["#f472b6", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"][i % 6],
      rot: Math.random() * 360,
      drift: (Math.random() - 0.5) * 160,
      w: 6 + Math.random() * 6,
    })),
  ).current;
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 0.45,
            background: p.color,
            ["--drift" as string]: `${p.drift}px`,
            ["--rot" as string]: `${p.rot + 720}deg`,
            animation: `memConfetti ${p.dur}s cubic-bezier(0.25,0.6,0.4,1) ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
};

const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [best, setBest] = useState(readBest);
  const [mismatchMsg, setMismatchMsg] = useState("");
  const [showMismatchMsg, setShowMismatchMsg] = useState(false);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [shakeIds, setShakeIds] = useState<number[]>([]);
  const [popIds, setPopIds] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [winMsg, setWinMsg] = useState("");
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const initGame = useCallback(() => {
    const pairs = [...CARD_EMOJIS, ...CARD_EMOJIS];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    setCards(pairs.map((emoji, id) => ({ id, emoji, isFlipped: false, isMatched: false })));
    setFlippedIds([]); setMoves(0); setMatches(0); setIsLocked(true); setGameWon(false);
    setSeconds(0); setStarted(false); setConsecutiveFails(0); setShowMismatchMsg(false);
    setRound(r => r + 1);
    // Unlock once the deal animation has finished.
    later(() => setIsLocked(false), 16 * 45 + 450);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  useEffect(() => {
    if (!started || gameWon) return;
    const t = window.setInterval(() => setSeconds(s => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [started, gameWon]);

  const handleCardClick = (id: number) => {
    if (isLocked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched || flippedIds.length >= 2) return;
    if (!started) setStarted(true);

    const newCards = cards.map(c => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    if (newFlipped.length < 2) return;

    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setIsLocked(true);
    const [first, second] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);

    if (first.emoji === second.emoji) {
      later(() => {
        setCards(prev => prev.map(c => (c.id === first.id || c.id === second.id ? { ...c, isMatched: true } : c)));
        setPopIds([first.id, second.id]);
        later(() => setPopIds([]), 700);
        setFlippedIds([]);
        setIsLocked(false);
        setConsecutiveFails(0);
        setShowMismatchMsg(false);
        const newMatches = matches + 1;
        setMatches(newMatches);
        if (newMatches === CARD_EMOJIS.length) {
          setGameWon(true);
          if (starsFor(nextMoves) === 3) unlock("total-recall");
          setWinMsg(pick(starsFor(nextMoves) === 3 ? PERFECT_WIN_MSGS : SAVAGE_WIN_MSGS).replace("{moves}", String(nextMoves)));
          if (!best || nextMoves < best) {
            setBest(nextMoves);
            try { localStorage.setItem(BEST_KEY, String(nextMoves)); } catch { /* storage blocked */ }
          }
        }
      }, 420);
    } else {
      setConsecutiveFails(prev => prev + 1);
      setMismatchMsg(pick(SAVAGE_MISMATCH_MSGS));
      setShowMismatchMsg(true);
      later(() => setShakeIds([first.id, second.id]), 450);
      later(() => setShowMismatchMsg(false), 1600);
      later(() => {
        setShakeIds([]);
        setCards(prev => prev.map(c => (c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c)));
        setFlippedIds([]);
        setIsLocked(false);
      }, 950);
    }
  };

  const stars = starsFor(moves);
  const progress = (matches / CARD_EMOJIS.length) * 100;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-36 md:pt-24 pb-10 page-transition">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a1240_0%,#07060b_60%)]" />
      <div className="absolute top-1/4 left-1/5 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/5 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />

      {gameWon && <Confetti key={round} />}

      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-md px-4">
        <div className="text-center fade-in-up">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-white">Memory</span>
            <span className="ml-2 bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">Match</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Flip two cards. Find all 8 pairs.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-xs fade-in-up delay-100" style={{ opacity: 0 }}>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10">
            <span className="text-white/40">Moves </span>
            <span key={moves} className="inline-block text-fuchsia-300 font-bold tabular-nums" style={{ animation: "memBump 0.3s ease-out" }}>{moves}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-1">
            <Timer size={12} className="text-sky-300" />
            <span className="text-sky-300 font-bold tabular-nums">{fmt(seconds)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-0.5" title="Rating">
            {[1, 2, 3].map(i => (
              <Star key={i} size={12} className={i <= stars ? "text-amber-300 fill-amber-300" : "text-white/20"} style={{ transition: "color 0.3s" }} />
            ))}
          </div>
          {best > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-1">
              <Trophy size={12} className="text-amber-300" />
              <span className="text-amber-300 font-bold tabular-nums">{best}</span>
            </div>
          )}
        </div>

        {/* Pair progress */}
        <div className="w-full max-w-[360px] h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-sky-400" style={{ width: `${progress}%`, transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)" }} />
        </div>

        <div key={round} className="grid grid-cols-4 gap-2.5 w-full max-w-[360px]" style={{ perspective: 900 }}>
          {cards.map((card, i) => {
            const faceUp = card.isFlipped || card.isMatched;
            const shaking = shakeIds.includes(card.id);
            const popping = popIds.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched}
                aria-label={faceUp ? card.emoji : "Hidden card"}
                className="relative aspect-square group"
                style={{ animation: `memDeal 0.5s cubic-bezier(0.34,1.4,0.64,1) ${i * 45}ms both` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${faceUp ? 180 : 0}deg)`,
                    transition: "transform 0.5s cubic-bezier(0.4,0.2,0.2,1)",
                    animation: shaking ? "memShake 0.45s ease-in-out" : popping ? "memPop 0.6s ease-out" : undefined,
                  }}
                >
                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden transition-[border-color,box-shadow] duration-300 group-hover:border-fuchsia-400/50 group-hover:shadow-[0_0_18px_rgba(217,70,239,0.25)]"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background: "linear-gradient(135deg, #1e1530, #12101d)",
                    }}
                  >
                    <div className="absolute inset-1.5 rounded-lg border border-dashed border-white/10" />
                    <span className="font-display text-lg text-fuchsia-300/40 group-hover:text-fuchsia-300/80 transition-colors">?</span>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)]" />
                  </div>
                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center text-3xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: card.isMatched ? "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(56,189,248,0.2))" : "linear-gradient(135deg, #2b2440, #1a1628)",
                      border: card.isMatched ? "1px solid rgba(52,211,153,0.6)" : "1px solid rgba(217,70,239,0.45)",
                      boxShadow: card.isMatched ? "0 0 22px rgba(52,211,153,0.35)" : "0 0 18px rgba(217,70,239,0.25)",
                    }}
                  >
                    <span style={{ animation: popping ? "memEmoji 0.6s ease-out" : undefined }}>{card.emoji}</span>
                  </div>
                </div>
                {popping && (
                  <span className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "0 0 0 2px rgba(52,211,153,0.8)", animation: "memRing 0.7s ease-out both" }} />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-8 flex items-center justify-center">
          {showMismatchMsg && (
            <p className="text-rose-400 text-sm font-bold pointer-events-none" style={{ animation: "memToast 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              {mismatchMsg}
              {consecutiveFails >= 3 && ` (${consecutiveFails}x streak 💀)`}
            </p>
          )}
        </div>

        {gameWon ? (
          <div className="rounded-2xl p-6 text-center border border-white/10 bg-white/[0.04] backdrop-blur-md" style={{ animation: "memWin 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <p className="font-display text-2xl font-extrabold text-white mb-2">🎉 You Won!</p>
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map(i => (
                <Star
                  key={i}
                  size={26}
                  className={i <= stars ? "text-amber-300 fill-amber-300" : "text-white/15"}
                  style={{ animation: `memStar 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.15}s both` }}
                />
              ))}
            </div>
            <p className="text-white/60 text-xs mb-2 italic max-w-[260px]">{winMsg}</p>
            <p className="text-white/40 text-xs mb-4">{moves} moves · {fmt(seconds)}</p>
            <button onClick={initGame} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500/70 to-sky-500/70 hover:scale-105 active:scale-95 transition-transform">
              Try Again (you'll need it) 🔄
            </button>
          </div>
        ) : (
          <button onClick={initGame} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/10 bg-white/[0.04] hover:text-white hover:border-white/25 transition-colors">
            <RotateCcw size={12} /> Shuffle & restart
          </button>
        )}
      </div>

      <style>{`
        @keyframes memDeal { 0% { opacity: 0; transform: translateY(-60px) rotate(-12deg) scale(0.6); } 100% { opacity: 1; transform: none; } }
        @keyframes memShake { 0%,100% { transform: rotateY(180deg) translateX(0); } 20% { transform: rotateY(180deg) translateX(-7px) rotate(-3deg); } 40% { transform: rotateY(180deg) translateX(7px) rotate(3deg); } 60% { transform: rotateY(180deg) translateX(-5px); } 80% { transform: rotateY(180deg) translateX(4px); } }
        @keyframes memPop { 0% { transform: rotateY(180deg) scale(1); } 40% { transform: rotateY(180deg) scale(1.14); } 100% { transform: rotateY(180deg) scale(1); } }
        @keyframes memEmoji { 0% { transform: scale(1); } 40% { transform: scale(1.35) rotate(-10deg); } 100% { transform: scale(1); } }
        @keyframes memRing { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
        @keyframes memToast { 0% { opacity: 0; transform: translateY(8px) scale(0.9); } 100% { opacity: 1; transform: none; } }
        @keyframes memBump { 0% { transform: scale(1.5); color: #fff; } 100% { transform: scale(1); } }
        @keyframes memWin { 0% { opacity: 0; transform: translateY(20px) scale(0.9); } 100% { opacity: 1; transform: none; } }
        @keyframes memStar { 0% { opacity: 0; transform: scale(0) rotate(-90deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes memConfetti { 0% { transform: translate(0, -20px) rotate(0); opacity: 1; } 100% { transform: translate(var(--drift), 105vh) rotate(var(--rot)); opacity: 0.9; } }
      `}</style>
    </section>
  );
};

export default MemoryGame;
