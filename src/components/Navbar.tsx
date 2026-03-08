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
  const [clicked, setClicked] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; tab: string }[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const i = tabs.findIndex(t => t.id === activeTab);
    const el = tabRefs.current[i];
    if (el) setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  const handleClick = useCallback((tab: "home" | "puzzle" | "info") => {
    // Trigger press animation
    setClicked(tab);
    setTimeout(() => setClicked(null), 400);

    // Spawn ripple
    const id = ++rippleId.current;
    setRipples(prev => [...prev, { id, tab }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);

    onTabChange(tab);
  }, [onTabChange]);

  const handleLogoClick = () => {
    if (activeTab === "puzzle") onLockClick?.();
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
      style={{
        transform: entered ? "translateY(0)" : "translateY(-50px)",
        opacity: entered ? 1 : 0,
        transition: "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease",
      }}
    >
      <div
        className="relative flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl"
        style={{
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(24px) saturate(1.2)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Subtle shimmer line on top */}
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-full pointer-events-none overflow-hidden"
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, transparent 20%, hsl(var(--primary) / 0.25) 50%, transparent 80%)",
              animation: "navShimmer 6s ease-in-out infinite",
            }}
          />
        </div>

        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden group"
          style={{
            background: activeTab === "puzzle" ? "hsl(var(--primary) / 0.1)" : "rgba(255,255,255,0.04)",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {activeTab === "puzzle" ? (
            <KeyRound
              className="w-3.5 h-3.5 text-primary"
              style={{
                filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.4))",
                animation: "navKeyBreathe 2.5s ease-in-out infinite",
              }}
            />
          ) : (
            <span
              className="text-xs font-bold font-display tracking-wider"
              style={{
                color: "hsl(var(--primary))",
                filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.3))",
              }}
            >
              42
            </span>
          )}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)",
              transition: "opacity 0.4s ease",
            }}
          />
        </button>

        {/* Tabs container */}
        <div className="relative flex items-center">
          {/* Sliding indicator */}
          <div
            className="absolute h-full top-0 rounded-xl pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: "hsl(var(--primary) / 0.08)",
              border: "1px solid hsl(var(--primary) / 0.15)",
              boxShadow: "0 0 16px hsl(var(--primary) / 0.06), inset 0 0 8px hsl(var(--primary) / 0.03)",
              transition: "all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />

          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id;
            const isClicked = clicked === tab.id;
            const Icon = tab.icon;
            const tabRipples = ripples.filter(r => r.tab === tab.id);

            return (
              <button
                key={tab.id}
                ref={el => (tabRefs.current[i] = el)}
                onClick={() => handleClick(tab.id)}
                className="relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl overflow-hidden"
                style={{
                  transform: isClicked ? "scale(0.9)" : "scale(1)",
                  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {/* Ripple effects */}
                {tabRipples.map(r => (
                  <div
                    key={r.id}
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{
                      background: "radial-gradient(circle at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
                      animation: "navRippleExpand 0.7s ease-out forwards",
                    }}
                  />
                ))}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    className="w-4 h-4"
                    style={{
                      color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.35)",
                      filter: isActive ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" : "none",
                      transform: isActive ? "scale(1.15)" : isClicked ? "scale(0.8) rotate(-8deg)" : "scale(1)",
                      transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  />
                  {/* Icon glow pulse when active */}
                  {isActive && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 60%)",
                        animation: "navIconGlow 2s ease-in-out infinite",
                        filter: "blur(4px)",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-[9px] font-display tracking-[0.18em] uppercase leading-none"
                  style={{
                    color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)",
                    opacity: isActive ? 1 : 0.6,
                    transform: isClicked ? "translateX(2px)" : "translateX(0)",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    textShadow: isActive ? "0 0 12px hsl(var(--primary) / 0.3)" : "none",
                  }}
                >
                  {tab.label}
                </span>

                {/* Bottom active bar */}
                <div
                  className="absolute bottom-0 left-[20%] right-[20%] h-[1.5px] rounded-full"
                  style={{
                    background: isActive ? "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" : "transparent",
                    boxShadow: isActive ? "0 0 8px hsl(var(--primary) / 0.4)" : "none",
                    transform: `scaleX(${isActive ? 1 : 0})`,
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />

                {/* Hover highlight */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none opacity-0 hover-parent"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    transition: "opacity 0.3s ease",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div
          className="w-px h-5 mx-1 rounded-full"
          style={{
            background: "linear-gradient(to bottom, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)",
          }}
        />

        <ThemeToggle />
      </div>

      <style>{`
        @keyframes navShimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes navRippleExpand {
          0% { opacity: 0.8; transform: scale(0.5); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes navIconGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes navKeyBreathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.08) rotate(3deg); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
