import { useState, useEffect, useRef, useMemo } from "react";
import { Lock, KeyRound, Home, Puzzle, User } from "lucide-react";
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
  const [hoverTab, setHoverTab] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = useMemo(
    () => [
      { id: "home", label: "HQ", icon: <Home className="w-4 h-4" /> },
      { id: "puzzle", label: "OPS", icon: <Puzzle className="w-4 h-4" /> },
      { id: "info", label: "ID", icon: <User className="w-4 h-4" /> },
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
    setTimeout(() => setClickedTab(null), 500);
    onTabChange(tab);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl bg-background/70 backdrop-blur-2xl border border-primary/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.08), 0 8px 32px rgba(0,0,0,0.4)' }}
      >
        {/* Lock/Logo button */}
        {activeTab === "puzzle" ? (
          <button
            onClick={onLockClick}
            className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all duration-300 group ml-0.5"
          >
            <KeyRound className="w-4 h-4 text-primary transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ml-0.5 logo-pulse">
            <span className="text-sm font-bold gradient-text font-display tracking-widest">42</span>
          </div>
        )}

        {/* Tab navigation */}
        <div className="relative flex items-center gap-0.5">
          {/* Sliding active indicator */}
          <div
            className="absolute h-full top-0 rounded-xl"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))',
              border: '1px solid hsl(var(--primary) / 0.25)',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--primary) / 0.1)',
            }}
          />

          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoverTab(tab.id)}
              onMouseLeave={() => setHoverTab(null)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-300"
            >
              <span
                className={`transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground"
                } ${clickedTab === tab.id ? "animate-[ping_0.5s_ease-out]" : ""}`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-xs font-display tracking-[0.2em] uppercase transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-primary opacity-100"
                    : "text-muted-foreground opacity-60"
                } ${hoverTab === tab.id && activeTab !== tab.id ? "opacity-90 text-foreground" : ""}`}
              >
                {tab.label}
              </span>
              
              {/* Active dot */}
              {activeTab === tab.id && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  style={{ boxShadow: '0 0 6px hsl(var(--primary) / 0.8)' }}
                />
              )}
            </button>
          ))}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
