import { useState, useEffect, useRef, useCallback } from "react";
import { KeyRound, Home, ShieldHalf, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const tabs = [
  { id: "home" as const, label: "HOME", icon: Home },
  { id: "puzzle" as const, label: "VAULT", icon: ShieldHalf },
  { id: "info" as const, label: "ABOUT", icon: User },
];

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [entered, setEntered] = useState(false);
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [morphX, setMorphX] = useState(0);
  const [morphW, setMorphW] = useState(0);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sparkId = useRef(0);

  useEffect(() => {
    setTimeout(() => setEntered(true), 150);
  }, []);

  useEffect(() => {
    const i = tabs.findIndex(t => t.id === activeTab);
    const el = tabRefs.current[i];
    const container = containerRef.current;
    if (el && container) {
      setMorphX(el.offsetLeft - container.offsetLeft);
      setMorphW(el.offsetWidth);
    }
  }, [activeTab]);

  const spawnSparks = (el: HTMLButtonElement) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const newSparks = Array.from({ length: 6 }, (_, i) => ({
      id: ++sparkId.current,
      x: cx,
      y: cy,
    }));
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks(prev => prev.filter(s => !newSparks.find(ns => ns.id === s.id)));
    }, 800);
  };

  const handleClick = useCallback((tab: "home" | "puzzle" | "info", i: number) => {
    setPressedTab(tab);
    setTimeout(() => setPressedTab(null), 500);
    const el = tabRefs.current[i];
    if (el) spawnSparks(el);
    onTabChange(tab);
  }, [onTabChange]);

  const handleLogoClick = () => {
    if (activeTab === "puzzle") onLockClick?.();
  };

  return (
    <>
      {/* Spark particles (portal to body level) */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        {sparks.map((s, i) => {
          const angle = (i % 6) * 60 + Math.random() * 30;
          const dist = 20 + Math.random() * 25;
          const rad = (angle * Math.PI) / 180;
          return (
            <div
              key={s.id}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: s.x,
                top: s.y,
                background: "hsl(var(--primary))",
                boxShadow: `0 0 6px hsl(var(--primary) / 0.8), 0 0 12px hsl(var(--primary) / 0.4)`,
                animation: "navSparkFly 0.6s ease-out forwards",
                "--spark-dx": `${Math.cos(rad) * dist}px`,
                "--spark-dy": `${Math.sin(rad) * dist - 15}px`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <nav
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-4"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.95)",
          transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="relative flex items-center"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(20px)",
            borderRadius: "50px",
            padding: "4px 6px",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Logo button */}
          <button
            onClick={handleLogoClick}
            className="relative w-8 h-8 rounded-full flex items-center justify-center mr-1 group overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              transition: "all 0.4s ease",
            }}
          >
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent)",
                transition: "opacity 0.5s ease",
              }}
            />
            {activeTab === "puzzle" ? (
              <KeyRound className="w-4 h-4 text-primary relative z-10" style={{
                filter: "drop-shadow(0 0 5px hsl(var(--primary) / 0.4))",
              }} />
            ) : (
              <span className="text-sm font-bold font-display text-primary relative z-10"
                style={{ filter: "drop-shadow(0 0 5px hsl(var(--primary) / 0.3))" }}>
                42
              </span>
            )}
          </button>

          {/* Tab section */}
          <div ref={containerRef} className="relative flex items-center">
            {/* Morph blob indicator */}
            <div
              className="absolute top-0 h-full rounded-full pointer-events-none z-0"
              style={{
                left: morphX,
                width: morphW,
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))`,
                border: "1px solid hsl(var(--primary) / 0.18)",
                boxShadow: `
                  0 0 24px hsl(var(--primary) / 0.08),
                  inset 0 1px 0 hsl(var(--primary) / 0.1)
                `,
                transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {/* Glow trail under indicator */}
            <div
              className="absolute -bottom-2 h-4 rounded-full pointer-events-none z-0"
              style={{
                left: morphX + morphW * 0.2,
                width: morphW * 0.6,
                background: "hsl(var(--primary) / 0.12)",
                filter: "blur(10px)",
                transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {tabs.map((tab, i) => {
              const isActive = activeTab === tab.id;
              const isPressed = pressedTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  ref={el => (tabRefs.current[i] = el)}
                  onClick={() => handleClick(tab.id, i)}
                  className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{
                    transform: isPressed
                      ? "scale(0.85) translateY(1px)"
                      : "scale(1) translateY(0)",
                    transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {/* Icon wrapper */}
                  <div className="relative">
                    <Icon
                      className="w-4 h-4 relative z-10"
                      style={{
                        color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)",
                        transform: isActive
                          ? "scale(1.2)"
                          : isPressed
                          ? "scale(0.7) rotate(-12deg)"
                          : "scale(1)",
                        filter: isActive ? `drop-shadow(0 0 8px hsl(var(--primary) / 0.6))` : "none",
                        transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    />
                    {/* Ring pulse on active */}
                    {isActive && (
                      <div
                        className="absolute -inset-1.5 rounded-full pointer-events-none"
                        style={{
                          border: "1px solid hsl(var(--primary) / 0.15)",
                          animation: "navRingPulse 2.5s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>

                  {/* Label with stagger */}
                  <span
                    className="text-[10px] font-display tracking-[0.2em] uppercase"
                    style={{
                      color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.25)",
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: isActive ? "0.25em" : "0.15em",
                      textShadow: isActive ? "0 0 15px hsl(var(--primary) / 0.35)" : "none",
                      transform: isPressed ? "translateX(3px) scale(0.95)" : "translateX(0) scale(1)",
                      transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="w-px h-6 mx-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          <ThemeToggle />

          {/* Ambient edge glow */}
          <div
            className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{
              background: "conic-gradient(from 180deg, transparent, hsl(var(--primary) / 0.06), transparent 40%)",
              animation: "navAmbientRotate 8s linear infinite",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1px",
              borderRadius: "17px",
            }}
          />
        </div>
      </nav>

      <style>{`
        @keyframes navSparkFly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--spark-dx), var(--spark-dy)) scale(0);
            opacity: 0;
          }
        }
        @keyframes navRingPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes navAmbientRotate {
          from { --nav-conic: 0deg; }
          to { --nav-conic: 360deg; }
        }
        @property --nav-conic {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
      `}</style>
    </>
  );
};

export default Navbar;
