import { useRef, useEffect, useState, useCallback } from "react";
import { Eraser, RotateCcw } from "lucide-react";

const ISLAND_ITEMS = [
  { emoji: "🌴", label: "Palm Tree" },
  { emoji: "🏠", label: "House" },
  { emoji: "🌺", label: "Flower" },
  { emoji: "🏖️", label: "Beach" },
  { emoji: "⛵", label: "Boat" },
  { emoji: "🐚", label: "Shell" },
  { emoji: "🌊", label: "Wave" },
  { emoji: "☀️", label: "Sun" },
  { emoji: "🦀", label: "Crab" },
  { emoji: "🐠", label: "Fish" },
];

interface PlacedItem {
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

const IslandCreator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#00BFFF");
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState<"draw" | "place" | "erase">("draw");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const COLORS = ["#00BFFF", "#FFD700", "#FF6347", "#32CD32", "#FF69B4", "#9370DB", "#FFFFFF", "#1a1a2e"];

  const drawBase = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Ocean
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, "#0a1628");
    ocean.addColorStop(0.4, "#0d2137");
    ocean.addColorStop(1, "#1a3a5c");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    // Island shape
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.65);
    ctx.bezierCurveTo(w * 0.25, h * 0.35, w * 0.45, h * 0.25, w * 0.5, h * 0.3);
    ctx.bezierCurveTo(w * 0.55, h * 0.25, w * 0.75, h * 0.35, w * 0.8, h * 0.65);
    ctx.bezierCurveTo(w * 0.7, h * 0.72, w * 0.3, h * 0.72, w * 0.2, h * 0.65);
    ctx.closePath();

    const islandGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.35);
    islandGrad.addColorStop(0, "#2d5a27");
    islandGrad.addColorStop(0.7, "#1e3d1a");
    islandGrad.addColorStop(1, "#d4a76a");
    ctx.fillStyle = islandGrad;
    ctx.fill();

    // Beach ring
    ctx.strokeStyle = "#d4a76a";
    ctx.lineWidth = 6;
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    drawBase(ctx, rect.width, rect.height);
  }, [drawBase]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);

    if (mode === "place" && selectedItem) {
      setPlacedItems(prev => [...prev, {
        emoji: selectedItem,
        x: pos.x,
        y: pos.y,
        size: 28 + Math.random() * 8,
        rotation: Math.random() * 20 - 10,
      }]);
      return;
    }

    if (mode === "erase") {
      setPlacedItems(prev => prev.filter(item =>
        Math.hypot(item.x - pos.x, item.y - pos.y) > 20
      ));
      return;
    }

    setIsDrawing(true);
    lastPos.current = pos;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "draw") return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPos.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const handleEnd = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const resetIsland = () => {
    setPlacedItems([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    drawBase(ctx, rect.width, rect.height);
  };

  return (
    <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden pt-16 page-transition">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />

      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-2xl px-4">
        <div className="text-center mb-1">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            <span className="text-foreground">Island</span>
            <span className="gradient-text ml-2">Creator</span>
          </h2>
          <p className="text-muted-foreground text-xs mt-1">Build your dream island</p>
        </div>

        {/* Canvas */}
        <div className="relative w-[90vw] max-w-[560px] aspect-[4/3] rounded-xl overflow-hidden glow-border">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{ cursor: mode === "place" ? "crosshair" : mode === "erase" ? "pointer" : "default" }}
          />
          {/* Placed emojis overlay */}
          {placedItems.map((item, i) => (
            <div
              key={i}
              className="absolute pointer-events-none select-none"
              style={{
                left: item.x - item.size / 2,
                top: item.y - item.size / 2,
                fontSize: item.size,
                transform: `rotate(${item.rotation}deg)`,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                animation: "fadeInUp 0.3s ease-out",
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* Tools */}
        <div className="flex flex-wrap justify-center gap-2">
          {/* Mode buttons */}
          <div className="glass rounded-lg p-1.5 flex gap-1">
            {(["draw", "place", "erase"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-300 ${
                  mode === m ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "erase" ? <Eraser size={14} /> : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {mode === "draw" && (
            <>
              <div className="glass rounded-lg p-1.5 flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform duration-200 ${drawColor === c ? "scale-125 ring-2 ring-primary" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="glass rounded-lg px-2 py-1.5 flex items-center gap-2 text-xs">
                <input type="range" min={1} max={12} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
                  className="w-16 h-1 accent-[hsl(var(--primary))] cursor-pointer" />
                <span className="text-primary font-bold w-4">{brushSize}</span>
              </div>
            </>
          )}

          {mode === "place" && (
            <div className="glass rounded-lg p-1.5 flex flex-wrap gap-1 max-w-xs">
              {ISLAND_ITEMS.map(item => (
                <button
                  key={item.emoji}
                  onClick={() => setSelectedItem(item.emoji)}
                  className={`text-lg p-1 rounded transition-all duration-200 ${
                    selectedItem === item.emoji ? "bg-primary/20 scale-110" : "hover:bg-primary/10"
                  }`}
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          )}

          <button onClick={resetIsland} className="glass px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default IslandCreator;
