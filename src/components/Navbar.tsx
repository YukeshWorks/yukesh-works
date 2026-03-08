import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Lock, KeyRound, Crosshair, Fingerprint, Eye } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

interface Tab {
  id: "home" | "puzzle" | "info";
  label: string;
  icon: React.ReactNode;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [clickedTab, setClickedTab] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; tab: string; x: number; y: number }[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [navVisible, setNavVisible] = useState(false);
  const [lockHover, setLockHover] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const rippleId = useRef(0);

  const tabs: Tab[] = useMemo(
    () => [
      { id: "home", label: "", icon: <Crosshair className="w-3.5 h-3.5" /> },
      { id: "puzzle", label: "VAULT", icon: <Fingerprint className="w-3.5 h-3.5" /> },
      { id: "info", label: "", icon: <Eye className="w-3.5 h-3.5" /> },
    ],
    []
  );

  // Entrance animation
  useEffect(() => {
    setTimeout(() => setNavVisible(true), 200);
  }, []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const activeRef = tabRefs.current[activeIndex];
    if (activeRef) {
      setIndicatorStyle({
        left: activeRef.offsetLeft,
        width: activeRef.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  const handleTabClick = useCallback((tab: "home" | "puzzle" | "info", e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = ++rippleId.current;
    setRipples(prev => [...prev, { id, tab, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);

    setClickedTab(tab);
    setTimeout(() => setClickedTab(null), 500);
    onTabChange(tab);
  }, [onTabChange]);

  return (
    <nav
      className="fixed top-4 left-1/2 z-50"
      style={{
        transform: `translateX(-50%) translateY(${navVisible ? 0 : -30}px) scale(${navVisible ? 1 : 0.9})`,
        opacity: navVisible ? 1 : 0,
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        filter: navVisible ? "blur(0)" : "blur(6px)",
      }}
    >
      <div
        ref={navRef}
        className="flex items-center gap-1 px-2 py-1.5 rounded-2xl backdrop-blur-2xl border border-border/40"
        style={{
          background: scrolled
            ? "linear-gradient(135deg, hsl(var(--background) / 0.9), hsl(var(--card) / 0.8))"
            : "linear-gradient(135deg, hsl(var(--background) / 0.7), hsl(var(--card) / 0.5))",
          boxShadow: `
            0 0 ${scrolled ? 50 : 30}px hsl(var(--primary) / ${scrolled ? 0.08 : 0.05}),
            0 ${scrolled ? 16 : 10}px ${scrolled ? 50 : 35}px rgba(0,0,0,${scrolled ? 0.6 : 0.4}),
            inset 0 1px 0 hsl(var(--foreground) / 0.06)
          `,
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Lock/Logo button */}
        {activeTab === "puzzle" ? (
          <button
            onClick={onLockClick}
            onMouseEnter={() => setLockHover(true)}
            onMouseLeave={() => setLockHover(false)}
            className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-500 group overflow-hidden"
            style={{
              boxShadow: lockHover ? "0 0 20px hsl(var(--primary) / 0.25), inset 0 0 15px hsl(var(--primary) / 0.1)" : "none",
            }}
          >
            <KeyRound
              className="w-4 h-4 text-primary transition-all duration-500"
              style={{
                transform: lockHover ? "scale(1.2) rotate(20deg)" : "scale(1) rotate(0deg)",
                filter: lockHover ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.7))" : "none",
              }}
            />
            <Lock
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-muted-foreground transition-all duration-500"
              style={{
                transform: lockHover ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0)",
                opacity: lockHover ? 0 : 1,
              }}
            />
            {/* Lock hover ring */}
            <div
              className="absolute inset-0 rounded-xl border border-primary/0 transition-all duration-500"
              style={{
                borderColor: lockHover ? "hsl(var(--primary) / 0.4)" : "transparent",
                transform: lockHover ? "scale(1.05)" : "scale(1)",
              }}
            />
          </button>
        ) : (
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden group">
            {/* Animated border orbit */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: "conic-gradient(from var(--logo-angle, 0deg), hsl(var(--primary) / 0.3), transparent 40%, transparent 60%, hsl(var(--primary) / 0.15))",
                animation: "logoOrbit 4s linear infinite",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                WebkitMaskComposite: "xor",
                padding: "1.5px",
              }}
            />
            <div className="absolute inset-[1.5px] rounded-[10px] bg-card/60" />
            <span className="text-sm font-bold gradient-text font-display tracking-widest relative z-10">42</span>
            {/* Breathing glow */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow: "0 0 15px hsl(var(--primary) / 0.1)",
                animation: "logoBreathe 3s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {/* Tab navigation */}
        <div className="relative flex items-center">
          {/* Sliding indicator with glow trail */}
          <div
            className="absolute h-full top-0 rounded-xl pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: "linear-gradient(180deg, hsl(var(--primary) / 0.14), hsl(var(--primary) / 0.06))",
              border: "1px solid hsl(var(--primary) / 0.25)",
              boxShadow: `
                0 0 28px hsl(var(--primary) / 0.15),
                0 0 10px hsl(var(--primary) / 0.1),
                inset 0 1px 0 hsl(var(--primary) / 0.2),
                inset 0 -1px 0 hsl(var(--primary) / 0.05)
              `,
            }}
          />
          {/* Indicator glow aura (behind) */}
          <div
            className="absolute h-[130%] top-[-15%] rounded-2xl pointer-events-none"
            style={{
              left: indicatorStyle.left - 4,
              width: indicatorStyle.width + 8,
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: "radial-gradient(ellipse, hsl(var(--primary) / 0.08), transparent 70%)",
              filter: "blur(4px)",
            }}
          />

          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={(e) => handleTabClick(tab.id, e)}
              onMouseEnter={() => setHovered(tab.id)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden"
            >
              {/* Ripple effects */}
              {ripples.filter(r => r.tab === tab.id).map(r => (
                <div
                  key={r.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: r.x,
                    top: r.y,
                    width: 0,
                    height: 0,
                    background: "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)",
                    animation: "navRipplePoint 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}

              {/* Hover glow underline */}
              <div
                className="absolute bottom-0 left-[20%] right-[20%] h-px transition-all duration-400"
                style={{
                  background: "linear-gradient(to right, transparent, hsl(var(--primary) / 0.4), transparent)",
                  opacity: hovered === tab.id && activeTab !== tab.id ? 1 : 0,
                  transform: `scaleX(${hovered === tab.id && activeTab !== tab.id ? 1 : 0})`,
                }}
              />

              {/* Icon */}
              <span
                className="relative z-10 transition-all duration-300"
                style={{
                  color: activeTab === tab.id
                    ? "hsl(var(--primary))"
                    : hovered === tab.id
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted-foreground))",
                  transform:
                    clickedTab === tab.id
                      ? "scale(0.7) rotate(-8deg)"
                      : activeTab === tab.id
                      ? "scale(1.2)"
                      : hovered === tab.id
                      ? "scale(1.1) translateY(-1px)"
                      : "scale(1)",
                  filter: activeTab === tab.id ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.6))" : "none",
                  transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {tab.icon}
              </span>

              {/* Label */}
              {tab.label && (
                <span
                  className="relative z-10 text-[10px] font-heading tracking-[0.25em] uppercase transition-all duration-400"
                  style={{
                    color: activeTab === tab.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    opacity: activeTab === tab.id ? 1 : hovered === tab.id ? 0.8 : 0.5,
                    letterSpacing: activeTab === tab.id ? "0.3em" : "0.25em",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {tab.label}
                </span>
              )}

              {/* Active bottom dot with ring */}
              {activeTab === tab.id && (
                <div className="absolute -bottom-0.5 left-1/2 flex items-center justify-center" style={{ transform: "translateX(-50%)" }}>
                  <div
                    className="w-1 h-1 rounded-full bg-primary"
                    style={{
                      boxShadow: "0 0 8px 2px hsl(var(--primary) / 0.6)",
                      animation: "navDotPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 rounded-full border border-primary/20"
                    style={{ animation: "navDotRing 1.5s ease-out infinite" }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Animated separator */}
        <div className="relative w-px h-5 mx-0.5 overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(to bottom, transparent, hsl(var(--border) / 0.5), transparent)",
              animation: "sepShimmer 3s ease-in-out infinite",
            }}
          />
        </div>

        <ThemeToggle />
      </div>

      <style>{`
        @keyframes logoOrbit {
          to { --logo-angle: 360deg; }
        }
        @property --logo-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes logoBreathe {
          0%, 100% { box-shadow: 0 0 10px hsl(var(--primary) / 0.05); }
          50% { box-shadow: 0 0 20px hsl(var(--primary) / 0.15); }
        }
        @keyframes navRipplePoint {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 120px; height: 120px; opacity: 0; }
        }
        @keyframes navDotPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.8); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes navDotRing {
          0% { transform: scale(0.5); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes sepShimmer {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(-2px); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
