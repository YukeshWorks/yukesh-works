import { useState, useEffect, useRef, useMemo } from "react";
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
  const [rippleTab, setRippleTab] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = useMemo(
    () => [
      { id: "home", label: "BASE", icon: <Crosshair className="w-3.5 h-3.5" /> },
      { id: "puzzle", label: "VAULT", icon: <Fingerprint className="w-3.5 h-3.5" /> },
      { id: "info", label: "INTEL", icon: <Eye className="w-3.5 h-3.5" /> },
    ],
    []
  );

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

  const handleTabClick = (tab: "home" | "puzzle" | "info") => {
    setClickedTab(tab);
    setRippleTab(tab);
    setTimeout(() => setClickedTab(null), 600);
    setTimeout(() => setRippleTab(null), 800);
    onTabChange(tab);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 navbar-entrance">
      <div 
        className="flex items-center gap-1 px-2 py-1.5 rounded-2xl backdrop-blur-2xl border border-border/40 navbar-glow"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.75), hsl(var(--card) / 0.6))',
          boxShadow: `
            0 0 40px hsl(var(--primary) / 0.06),
            0 12px 40px rgba(0,0,0,0.5),
            inset 0 1px 0 hsl(var(--foreground) / 0.05)
          `,
        }}
      >
        {/* Lock/Logo button */}
        {activeTab === "puzzle" ? (
          <button
            onClick={onLockClick}
            className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/25 transition-all duration-400 group"
          >
            <KeyRound className="w-4 h-4 text-primary transition-all duration-400 group-hover:scale-110 group-hover:rotate-[15deg] group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center logo-pulse relative overflow-hidden">
            <span className="text-sm font-bold gradient-text font-display tracking-widest relative z-10">42</span>
            <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-xl" />
          </div>
        )}

        {/* Tab navigation */}
        <div className="relative flex items-center">
          {/* Magnetic sliding indicator */}
          <div
            className="absolute h-full top-0 rounded-xl pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transition: "all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: 'linear-gradient(180deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.06))',
              border: '1px solid hsl(var(--primary) / 0.2)',
              boxShadow: `
                0 0 24px hsl(var(--primary) / 0.12),
                0 0 8px hsl(var(--primary) / 0.08),
                inset 0 1px 0 hsl(var(--primary) / 0.15)
              `,
            }}
          />

          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all duration-400 group overflow-hidden"
            >
              {/* Ripple effect on click */}
              {rippleTab === tab.id && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-primary/20 animate-[navRipple_0.8s_ease-out_forwards]" />
                </div>
              )}

              <span
                className={`relative z-10 transition-all duration-400 ${
                  activeTab === tab.id
                    ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground group-hover:text-foreground"
                } ${clickedTab === tab.id ? "scale-90" : "scale-100"}`}
                style={{
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: activeTab === tab.id ? 'scale(1.15)' : clickedTab === tab.id ? 'scale(0.85)' : 'scale(1)',
                }}
              >
                {tab.icon}
              </span>
              <span
                className={`relative z-10 text-[10px] font-heading tracking-[0.25em] uppercase transition-all duration-400 ${
                  activeTab === tab.id
                    ? "text-primary opacity-100"
                    : "text-muted-foreground opacity-50 group-hover:opacity-80 group-hover:text-foreground"
                }`}
              >
                {tab.label}
              </span>
              
              {/* Active glow dot */}
              {activeTab === tab.id && (
                <div 
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary nav-dot-entrance"
                  style={{ boxShadow: '0 0 8px 2px hsl(var(--primary) / 0.6)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border/30 mx-0.5" />

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
