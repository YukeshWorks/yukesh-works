import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { KeyRound, Home, ShieldHalf, User } from "lucide-react";
import navLogoGif from "@/assets/nav-logo.gif";
import ThemeToggle from "./ThemeToggle";
import ProModeButton from "./ProModeButton";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [clickedTab, setClickedTab] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [logoSpin, setLogoSpin] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = useMemo(() => [
    { id: "home" as const, label: "HOME", icon: <Home className="w-4 h-4" /> },
    { id: "puzzle" as const, label: "VAULT", icon: <ShieldHalf className="w-4 h-4" /> },
    { id: "info" as const, label: "ABOUT", icon: <User className="w-4 h-4" /> },
  ], []);

  // Dramatic staggered entrance
  useEffect(() => {
    setTimeout(() => setEntered(true), 300);
  }, []);

  // Periodic glitch effect
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 150);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const i = tabs.findIndex(t => t.id === activeTab);
    const ref = tabRefs.current[i];
    if (ref) setIndicatorStyle({ left: ref.offsetLeft, width: ref.offsetWidth });
  }, [activeTab, tabs]);

  const handleTabClick = useCallback((tab: "home" | "puzzle" | "info") => {
    setClickedTab(tab);
    setPulseActive(true);
    setTimeout(() => setClickedTab(null), 600);
    setTimeout(() => setPulseActive(false), 1000);
    onTabChange(tab);
  }, [onTabChange]);

  const handleLogoClick = () => {
    if (activeTab === "puzzle") {
      setLogoSpin(true);
      setTimeout(() => setLogoSpin(false), 800);
      onLockClick?.();
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
      style={{
        transform: `translateY(${entered ? 0 : -60}px)`,
        opacity: entered ? 1 : 0,
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        filter: entered ? "blur(0)" : "blur(12px)",
      }}
    >
      <div
        className="relative flex items-center gap-0.5 px-1.5 py-1.5 rounded-full overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--background) / 0.65), hsl(var(--card) / 0.45))",
          backdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid hsl(var(--primary) / 0.15)",
          boxShadow: `
            0 0 60px hsl(var(--primary) / 0.08),
            0 20px 60px rgba(0,0,0,0.5),
            inset 0 1px 0 hsl(var(--foreground) / 0.08),
            inset 0 -1px 0 hsl(var(--background) / 0.3)
          `,
        }}
      >
        {/* Animated top edge light sweep */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
            animation: "navSweep 4s ease-in-out infinite",
          }}
        />

        {/* Glitch overlay */}
        {glitching && (
          <div className="absolute inset-0 pointer-events-none z-30 rounded-2xl overflow-hidden">
            <div style={{
              position: "absolute", inset: 0,
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.03) 2px, hsl(var(--primary) / 0.03) 4px)`,
              animation: "navGlitch 0.15s steps(3) forwards",
            }} />
          </div>
        )}

        {/* Logo / Lock */}
        <button
          onClick={handleLogoClick}
          className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden group"
          style={{
            background: activeTab === "puzzle"
              ? "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.08))"
              : "linear-gradient(135deg, hsl(var(--card) / 0.6), hsl(var(--card) / 0.3))",
            border: `1px solid hsl(var(--primary) / ${activeTab === "puzzle" ? 0.35 : 0.1})`,
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Rotating border ring */}
          <div
            className="absolute inset-[-1px] rounded-full pointer-events-none"
            style={{
              background: "conic-gradient(from var(--nav-orbit, 0deg), hsl(var(--primary) / 0.4), transparent 30%, transparent 70%, hsl(var(--primary) / 0.2))",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1.5px",
              animation: "navOrbit 3s linear infinite",
            }}
          />

          {activeTab === "puzzle" ? (
            <KeyRound
              className="w-3.5 h-3.5 text-primary relative z-10"
              style={{
                transform: logoSpin ? "rotate(360deg) scale(1.3)" : "rotate(0) scale(1)",
                filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))",
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          ) : (
            <div className="relative z-10 flex items-center justify-center">
              <span
                className="text-sm font-display font-bold text-primary"
                style={{
                  filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))",
                  animation: "navLogoPulse 2s ease-in-out infinite",
                  letterSpacing: "0.05em",
                }}
              >
                42
              </span>
            </div>
          )}
        </button>

        {/* Tabs */}
        <div className="relative flex items-center">
          {/* Sliding indicator — morphing blob */}
          <div
            className="absolute h-full top-0 rounded-xl pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transition: "all 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: "linear-gradient(180deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))",
              border: "1px solid hsl(var(--primary) / 0.3)",
              boxShadow: `
                0 0 30px hsl(var(--primary) / 0.2),
                0 0 12px hsl(var(--primary) / 0.12),
                inset 0 1px 0 hsl(var(--primary) / 0.25)
              `,
            }}
          />
          {/* Expanding glow behind indicator */}
          <div
            className="absolute top-[-30%] h-[160%] rounded-3xl pointer-events-none"
            style={{
              left: indicatorStyle.left - 8,
              width: indicatorStyle.width + 16,
              transition: "all 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: "radial-gradient(ellipse, hsl(var(--primary) / 0.1), transparent)",
              filter: "blur(8px)",
              opacity: pulseActive ? 1 : 0.6,
            }}
          />

          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isHovered = hovered === tab.id;
            const isClicked = clickedTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[index] = el)}
                onClick={() => handleTabClick(tab.id)}
                onMouseEnter={() => setHovered(tab.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl overflow-hidden"
                style={{ minWidth: 52 }}
              >
                {/* Click flash */}
                {isClicked && (
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 60%)",
                      animation: "navFlash 0.6s ease-out forwards",
                    }}
                  />
                )}

                {/* Icon with spring animation */}
                <span
                  className="relative z-10 transition-all"
                  style={{
                    color: isActive
                      ? "hsl(var(--primary))"
                      : isHovered
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted-foreground))",
                    transform: isClicked
                      ? "scale(0.6) translateY(2px)"
                      : isActive
                      ? "scale(1.25) translateY(-1px)"
                      : isHovered
                      ? "scale(1.15) translateY(-2px)"
                      : "scale(1)",
                    filter: isActive
                      ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.7)) drop-shadow(0 2px 4px hsl(var(--primary) / 0.3))"
                      : "none",
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {tab.icon}
                </span>

                {/* Label — appears below icon */}
                <span
                  className="relative z-10 text-[8px] font-display tracking-[0.2em] uppercase leading-none"
                  style={{
                    color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    opacity: isActive ? 1 : isHovered ? 0.7 : 0.35,
                    transform: isActive ? "translateY(0) scaleX(1)" : isHovered ? "translateY(0) scaleX(0.95)" : "translateY(2px) scaleX(0.8)",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {tab.label}
                </span>

                {/* Active indicator — animated bar + glow */}
                <div
                  className="absolute -bottom-[1px] left-[25%] right-[25%] h-[2px] rounded-full"
                  style={{
                    background: isActive
                      ? "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)"
                      : "transparent",
                    boxShadow: isActive ? "0 0 10px hsl(var(--primary) / 0.5), 0 0 4px hsl(var(--primary) / 0.3)" : "none",
                    transform: `scaleX(${isActive ? 1 : 0})`,
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />

                {/* Hover particles */}
                {isHovered && !isActive && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="absolute w-0.5 h-0.5 rounded-full bg-primary/40"
                        style={{
                          left: `${30 + i * 20}%`,
                          bottom: "20%",
                          animation: `navParticle 0.8s ease-out forwards`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Separator with energy line */}
        <div className="relative w-px h-7 mx-1">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 10%, hsl(var(--primary) / 0.3) 50%, transparent 90%)",
              animation: "navSepPulse 2s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-primary/50 left-1/2 -translate-x-1/2"
            style={{ animation: "navSepDot 2s ease-in-out infinite" }}
          />
        </div>

        <ThemeToggle />
        <ProModeButton />

        {/* Bottom edge glow */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)",
          }}
        />
      </div>

      <style>{`
        @property --nav-orbit {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes navOrbit { to { --nav-orbit: 360deg; } }
        @keyframes navSweep {
          0% { transform: translateX(-100%); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes navLogoPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.4)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 10px hsl(var(--primary) / 0.7)); }
        }
        @keyframes navFlash {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes navParticle {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-16px); opacity: 0; }
        }
        @keyframes navSepPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes navSepDot {
          0%, 100% { top: 70%; opacity: 0.3; }
          50% { top: 20%; opacity: 0.8; }
        }
        @keyframes navGlitch {
          0% { clip-path: inset(20% 0 60% 0); transform: translateX(-2px); }
          33% { clip-path: inset(50% 0 10% 0); transform: translateX(2px); }
          66% { clip-path: inset(10% 0 70% 0); transform: translateX(-1px); }
          100% { clip-path: inset(0); transform: translateX(0); opacity: 0; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
