import { useRef, useEffect, useState, useCallback } from "react";

const RAINBOW_COLORS = [
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3",
  "#FF1493", "#00FFFF", "#FF6347", "#7FFF00", "#FF00FF",
];

const RainbowScratch = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Draw rainbow background
  const drawRainbow = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Rainbow gradient background
    for (let i = 0; i < RAINBOW_COLORS.length; i++) {
      const x = (w / RAINBOW_COLORS.length) * i;
      const nextX = (w / RAINBOW_COLORS.length) * (i + 1);
      const gradient = ctx.createLinearGradient(x, 0, nextX, h);
      gradient.addColorStop(0, RAINBOW_COLORS[i]);
      gradient.addColorStop(1, RAINBOW_COLORS[(i + 3) % RAINBOW_COLORS.length]);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, nextX - x + 1, h);
    }

    // Add sparkles
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`;
      ctx.fill();
    }

    // Text
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 24px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🌈 YOU FOUND IT! 🌈", w / 2, h / 2 - 10);
    ctx.font = "16px Urbanist, sans-serif";
    ctx.fillText("Rainbow treasure unlocked", w / 2, h / 2 + 20);
  }, []);

  // Draw scratch overlay
  const drawOverlay = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Dark metallic overlay
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#2d2d44");
    gradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Scratch pattern hints
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.font = "bold 14px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ SCRATCH HERE ✨", w / 2, h / 2 - 5);
    ctx.font = "11px Urbanist, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillText("Reveal the rainbow", w / 2, h / 2 + 15);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    [canvas, overlay].forEach(c => {
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
    
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
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
    if (percent > 60 && !isRevealed) {
      setIsRevealed(true);
    }
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
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[320px] aspect-[4/3] rounded-xl overflow-hidden glow-border">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
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
        {isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-[scale-in_0.5s_ease-out]" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="glass px-3 py-1.5 rounded-lg text-xs">
          <span className="text-muted-foreground">Scratched: </span>
          <span className="text-primary font-bold">{scratchPercent}%</span>
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
