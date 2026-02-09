import { useState, useEffect, useRef, useMemo } from "react";
import { Home, Puzzle, Info, Lock, KeyRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

interface Tab {
  id: "home" | "puzzle" | "info";
  label: string;
  icon: typeof Home;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = useMemo(
    () => [
      { id: "home", label: "Home", icon: Home },
      { id: "puzzle", label: "Puzzle", icon: Puzzle },
      { id: "info", label: "Info", icon: Info },
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

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/30 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        {/* Lock/Logo button */}
        {activeTab === "puzzle" ? (
          <button
            onClick={onLockClick}
            className="relative w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all duration-300 group ml-0.5"
          >
            <KeyRound className="w-4 h-4 text-primary transition-transform duration-200 group-hover:scale-110" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center ml-0.5">
            <span className="text-xs font-bold gradient-text font-mono">42</span>
          </div>
        )}

        {/* Segmented pill navigation */}
        <div className="relative flex items-center">
          {/* Floating active indicator pill */}
          <div
            className="absolute h-[calc(100%-6px)] top-[3px] rounded-full bg-primary/15 border border-primary/20"
            style={{
              left: indicatorStyle.left + 2,
              width: indicatorStyle.width - 4,
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.3)",
            }}
          />

          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium tracking-wider uppercase transition-all duration-300 rounded-full ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon
                className={`w-3.5 h-3.5 transition-all duration-300 ${
                  activeTab === tab.id
                    ? "scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]"
                    : "scale-100"
                }`}
              />
              {tab.label}
            </button>
          ))}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
