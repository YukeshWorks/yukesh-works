import { useEffect, useRef, useCallback } from "react";

const PARTICLE_COUNT = 35;

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }[]>([]);
  const rafRef = useRef<number>(0);
  const hslRef = useRef({ h: 185, s: 80, l: 50 });

  const init = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 1.2 + 0.4,
      opacity: Math.random() * 0.25 + 0.08,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      // Sharp on retina, capped at 2x to keep fill cost low.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Read HSL once
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--primary").trim();
    const parts = primary.split(" ").map(v => parseFloat(v));
    if (parts.length === 3) { hslRef.current = { h: parts[0], s: parts[1], l: parts[2] }; }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = 0;

    const draw = (t = 0) => {
      // Scale movement by elapsed time so 60/90/120/144Hz screens all drift at the same speed.
      const step = last ? Math.min((t - last) / 16.67, 3) : 1;
      last = t;
      ctx.clearRect(0, 0, w, h);
      const { h: ch, s: cs, l: cl } = hslRef.current;
      ctx.fillStyle = `hsl(${ch}, ${cs}%, ${cl}%)`;
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reduceMotion) {
          p.x += p.vx * step;
          p.y += p.vy * step;
        }
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        const dx = mx - p.x, dy = my - p.y;
        const distSq = dx * dx + dy * dy;
        const glow = distSq < 22500 ? (1 - Math.sqrt(distSq) / 150) * 0.3 : 0;

        ctx.globalAlpha = p.opacity + glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

export default ParticleBackground;
