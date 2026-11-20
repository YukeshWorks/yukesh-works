import { useEffect, useState } from "react";
import { ACHIEVEMENTS, onUnlock, type AchievementId } from "@/lib/siteEvents";

/* Slide-in trophy card for each unlocked achievement, one at a time, with a soft chime. */

const chime = () => {
  try {
    const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [784, 988, 1319].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch { /* audio unavailable */ }
};

const AchievementToasts = () => {
  const [queue, setQueue] = useState<AchievementId[]>([]);
  const [current, setCurrent] = useState<AchievementId | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => onUnlock(id => setQueue(q => [...q, id])), []);

  // Show the next queued achievement whenever nothing is on screen.
  useEffect(() => {
    if (current || !queue.length) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setLeaving(false);
    setCurrent(next);
    chime();
  }, [queue, current]);

  useEffect(() => {
    if (!current) return;
    const t1 = window.setTimeout(() => setLeaving(true), 3400);
    const t2 = window.setTimeout(() => setCurrent(null), 3900);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [current]);

  const a = ACHIEVEMENTS.find(x => x.id === current);
  if (!a) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[10000] pointer-events-none" role="status" aria-live="polite" style={{ transform: "translateX(-50%)" }}>
      <div
        className="relative flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(20,18,12,0.92), rgba(10,10,14,0.92))",
          border: "1px solid rgba(251,191,36,0.45)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(251,191,36,0.2)",
          backdropFilter: "blur(14px)",
          animation: leaving ? "achOut 0.45s ease-in both" : "achIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <span className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 35%, rgba(251,191,36,0.18) 50%, transparent 65%)", animation: "achSweep 1.4s ease-out 0.3s both" }} />
        <div className="relative w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(251,191,36,0.12)", animation: "achIcon 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}>
          {a.icon}
        </div>
        <div className="relative">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-300/90">Achievement unlocked</p>
          <p className="font-display text-sm font-bold text-white">{a.title}</p>
          <p className="text-[10px] text-white/45">{a.hint}</p>
        </div>
      </div>
      <style>{`
        @keyframes achIn { 0% { opacity: 0; transform: translateY(40px) scale(0.85); } 100% { opacity: 1; transform: none; } }
        @keyframes achOut { to { opacity: 0; transform: translateY(24px) scale(0.95); } }
        @keyframes achSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes achIcon { 0% { transform: scale(0) rotate(-40deg); } 100% { transform: none; } }
      `}</style>
    </div>
  );
};

export default AchievementToasts;
