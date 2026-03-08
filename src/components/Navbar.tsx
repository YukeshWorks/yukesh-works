import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    setClicked(tab);
    setTimeout(() => setClicked(null), 500);
    onTabChange(tab);
  }, [onTabChange]);

  const handleLogoClick = () => {
    if (activeTab === "puzzle") onLockClick?.();
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-4"
      style={{
        transform: entered ? "translateY(0)" : "translateY(-40px)",
        opacity: entered ? 1 : 0,
        transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease",
      }}
    >
      <div
        className="relative flex items-center gap-1 px-2 py-1.5 rounded-2xl"
        style={{
          background: "hsl(var(--background) / 0.6)",
          backdropFilter: "blur(20px) saturate(1.3)",
          border: "1px solid hsl(var(--border) / 0.4)",
          boxShadow: "0 8px 32px hsl(var(--background) / 0.4), 0 0 0 1px hsl(var(--primary) / 0.06)",
        }}
      >
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 hover:scale-110"
          style={{
            background: activeTab === "puzzle"
              ? "hsl(var(--primary) / 0.12)"
              : "hsl(var(--muted) / 0.3)",
          }}
        >
          {activeTab === "puzzle" ? (
            <KeyRound className="w-3.5 h-3.5 text-primary transition-transform duration-500" />
          ) : (
            <span className="text-xs font-bold text-primary font-display tracking-wider">42</span>
          )}
        </button>

        {/* Tabs */}
        <div className="relative flex items-center">
          {/* Sliding indicator */}
          <div
            className="absolute h-full top-0 rounded-xl pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.2)",
              boxShadow: "0 0 20px hsl(var(--primary) / 0.08)",
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />

          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id;
            const isClicked = clicked === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                ref={el => (tabRefs.current[i] = el)}
                onClick={() => handleClick(tab.id)}
                className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl group"
                style={{
                  transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isClicked ? "scale(0.92)" : "scale(1)",
                }}
              >
                <Icon
                  className="w-3.5 h-3.5 transition-all duration-400"
                  style={{
                    color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    filter: isActive ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" : "none",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                <span
                  className="text-[10px] font-display tracking-[0.15em] uppercase"
                  style={{
                    color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    opacity: isActive ? 1 : 0.5,
                    transition: "all 0.4s ease",
                  }}
                >
                  {tab.label}
                </span>

                {/* Active dot */}
                <div
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 0 6px hsl(var(--primary) / 0.6)",
                    transform: `translateX(-50%) scale(${isActive ? 1 : 0})`,
                    opacity: isActive ? 1 : 0,
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />

                {/* Ripple on click */}
                {isClicked && (
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)",
                      animation: "navRipple 0.5s ease-out forwards",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div
          className="w-px h-5 mx-0.5"
          style={{ background: "hsl(var(--border) / 0.4)" }}
        />

        <ThemeToggle />
      </div>

      <style>{`
        @keyframes navRipple {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.3); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
