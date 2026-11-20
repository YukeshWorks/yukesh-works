import { useEffect, useRef, useState, type ReactNode } from "react";

/* Small hero effects: a text decode, magnetic elements, and a pointer tilt. */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$<>/\\{}[]*+=";

/** Text that decodes from random glyphs, left to right, once `play` is true. */
export const ScrambleText = ({ text, play, duration = 1100 }: { text: string; play: boolean; duration?: number }) => {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!play || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOut(text); return; }
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const settled = Math.floor(p * text.length);
      setOut(text.split("").map((ch, i) => (ch === " " || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [play, text, duration]);
  return <span aria-label={text}><span aria-hidden="true">{out}</span></span>;
};

/** Pulls its child toward the cursor while hovered, then springs back. Fine pointers only. */
export const Magnetic = ({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = "transform 0.15s ease-out";
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.transform = "";
  };
  return (
    <span ref={ref} className="inline-flex" onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </span>
  );
};

/** Tilts its content a few degrees toward the pointer anywhere on the page. */
export const PointerTilt = ({ children, max = 4, className = "" }: { children: ReactNode; max?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const step = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      if (ref.current) ref.current.style.transform = `perspective(1000px) rotateY(${cur.x * max * 2}deg) rotateX(${-cur.y * max * 1.5}deg)`;
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001 ? requestAnimationFrame(step) : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, [max]);
  return <div ref={ref} className={className} style={{ transformStyle: "preserve-3d" }}>{children}</div>;
};
