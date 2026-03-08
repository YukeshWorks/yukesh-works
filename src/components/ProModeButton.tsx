import { useState, useEffect } from "react";
import skullGif from "@/assets/skull-pro.gif";

interface ProModeButtonProps {
  onToggle?: (active: boolean) => void;
}

const ProModeButton = ({ onToggle }: ProModeButtonProps) => {
  const [active, setActive] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pro-mode") === "true";
    if (saved) {
      setActive(true);
      applyPro(true);
      onToggle?.(true);
    }
  }, []);

  const applyPro = (on: boolean) => {
    const root = document.documentElement;
    if (on) {
      root.classList.remove("theme-blue", "theme-red", "theme-dark");
      root.classList.add("theme-pro");
      document.body.style.fontFamily = "'Playfair Display', 'Georgia', serif";
    } else {
      root.classList.remove("theme-pro");
      const saved = localStorage.getItem("portfolio-theme") || "blue";
      root.classList.add(`theme-${saved}`);
      document.body.style.fontFamily = "";
    }
  };

  const toggle = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 800);
    const next = !active;
    setActive(next);
    localStorage.setItem("pro-mode", String(next));
    applyPro(next);
    onToggle?.(next);
  };

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden group"
      title={active ? "Pro Mode: ON" : "Pro Mode: OFF"}
      style={{
        background: active
          ? "linear-gradient(135deg, hsl(42 90% 55% / 0.25), hsl(28 80% 50% / 0.15))"
          : "linear-gradient(135deg, hsl(var(--card) / 0.6), hsl(var(--card) / 0.3))",
        border: active
          ? "2px solid hsl(42 90% 55% / 0.6)"
          : "1px solid hsl(var(--primary) / 0.15)",
        boxShadow: active
          ? "0 0 20px hsl(42 90% 55% / 0.4), 0 0 40px hsl(42 90% 55% / 0.15)"
          : "none",
        backdropFilter: "blur(12px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: pulse ? "scale(1.2)" : "scale(1)",
      }}
    >
      {/* Rotating ring when active */}
      {active && (
        <div
          className="absolute inset-[-1px] rounded-full pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, hsl(42 90% 55% / 0.5), transparent 30%, transparent 70%, hsl(28 80% 50% / 0.4))",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1.5px",
            animation: "proRing 2s linear infinite",
          }}
        />
      )}

      <img
        src={skullGif}
        alt="Pro Mode"
        className="w-6 h-6 object-contain relative z-10"
        style={{
          filter: active
            ? "drop-shadow(0 0 8px hsl(42 90% 55% / 0.7)) brightness(1.2)"
            : "grayscale(0.5) opacity(0.7)",
          transition: "all 0.5s ease",
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(42 90% 55% / 0.25), transparent 70%)",
        }}
      />

      <style>{`
        @keyframes proRing {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default ProModeButton;
