import { useEffect, useRef } from "react";

const CursorLight = () => {
  const lightRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -200, y: -200 });
  const target = useRef({ x: -200, y: -200 });
  const raf = useRef<number>(0);

  useEffect(() => {
    // Only on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let running = false;
    const animate = () => {
      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      pos.current.x += dx * 0.18;
      pos.current.y += dy * 0.18;
      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${pos.current.x - 150}px, ${pos.current.y - 150}px, 0)`;
      }
      // Sleep once the light has caught up with the cursor.
      if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) { running = false; return; }
      raf.current = requestAnimationFrame(animate);
    };

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!running) { running = true; raf.current = requestAnimationFrame(animate); }
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={lightRef}
      className="fixed top-0 left-0 z-[1] pointer-events-none"
      style={{
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        willChange: "transform",
        transform: "translate(-200px, -200px)",
      }}
    />
  );
};

export default CursorLight;
