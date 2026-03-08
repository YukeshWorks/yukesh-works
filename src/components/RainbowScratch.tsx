import { useRef, useEffect, useState, useCallback } from "react";

const RAINBOW_COLORS = [
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3",
  "#FF1493", "#00FFFF", "#FF6347", "#7FFF00", "#FF00FF",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const RainbowScratch = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [pencilSize, setPencilSize] = useState(30);

  const spawnParticles = (x: number, y: number) => {
    const count = Math.floor(pencilSize / 8) + 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)],
        size: Math.random() * 3 + 1.5,
        life: 1,
        maxLife: Math.random() * 30 + 20,
      });
    }
  };

  // Particle animation loop
  useEffect(() => {
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;

    const animate = () => {
      const ctx = pCanvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      const dpr = window.devicePixelRatio || 1;
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, p.size * dpr, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.shadowBlur = 6 * dpr;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const drawRainbow = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    for (let i = 0; i < RAINBOW_COLORS.length; i++) {
      const x = (w / RAINBOW_COLORS.length) * i;
      const nextX = (w / RAINBOW_COLORS.length) * (i + 1);
      const gradient = ctx.createLinearGradient(x, 0, nextX, h);
      gradient.addColorStop(0, RAINBOW_COLORS[i]);
      gradient.addColorStop(1, RAINBOW_COLORS[(i + 3) % RAINBOW_COLORS.length]);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, nextX - x + 1, h);
    }

    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.7 + 0.3})`;
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 24px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🌈 YOU FOUND IT! 🌈", w / 2, h / 2 - 10);
    ctx.font = "16px Urbanist, sans-serif";
    ctx.fillText("Rainbow treasure unlocked", w / 2, h / 2 + 20);
  }, []);

  const drawOverlay = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#2d2d44");
    gradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "bold 14px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ SCRATCH HERE ✨", w / 2, h / 2 - 5);
    ctx.font = "11px Urbanist, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillText("Reveal the rainbow", w / 2, h / 2 + 15);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const pCanvas = particleCanvasRef.current;
    if (!canvas || !overlay || !pCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    [canvas, overlay, pCanvas].forEach(c => {
      c.width = w * dpr;
      c.height = h * dpr;
      c.getContext("2d")?.scale(dpr, dpr);
    });

    drawRainbow(canvas);
    drawOverlay(overlay);
  }, [drawRainbow, drawOverlay]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const scratch = (pos: { x: number; y: number }) => {
    const ctx = overlayRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    const radius = pencilSize / 2;

    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = pencilSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    spawnParticles(pos.x, pos.y);
    lastPos.current = pos;
  };

  const checkScratchPercent = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, overlay.width, overlay.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const percent = (transparent / (imageData.data.length / 4)) * 100;
    setScratchPercent(Math.round(percent));
    if (percent > 60 && !isRevealed) setIsRevealed(true);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
    scratch(lastPos.current);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    scratch(getPos(e));
  };

  const handleEnd = () => {
    isDrawing.current = false;
    lastPos.current = null;
    checkScratchPercent();
  };

  const resetScratch = () => {
    setIsRevealed(false);
    setScratchPercent(0);
    particlesRef.current = [];
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-over";
        drawOverlay(overlay);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      <div className="relative w-[90vw] max-w-[600px] aspect-[4/3] rounded-xl overflow-hidden glow-border">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <canvas
          ref={overlayRef}
          className={`absolute inset-0 w-full h-full touch-none ${isRevealed ? 'pointer-events-none opacity-0 transition-opacity duration-1000' : ''}`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ cursor: "crosshair" }}
        />
        <canvas ref={particleCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="glass px-3 py-1.5 rounded-lg text-xs">
          <span className="text-muted-foreground">Scratched: </span>
          <span className="text-primary font-bold">{scratchPercent}%</span>
        </div>

        <div className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
          <span className="text-muted-foreground">Size:</span>
          <input
            type="range"
            min={10}
            max={60}
            value={pencilSize}
            onChange={e => setPencilSize(Number(e.target.value))}
            className="w-20 h-1 accent-[hsl(var(--primary))] cursor-pointer"
          />
          <span className="text-primary font-bold w-5 text-right">{pencilSize}</span>
        </div>

        <button
          onClick={resetScratch}
          className="glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default RainbowScratch;
