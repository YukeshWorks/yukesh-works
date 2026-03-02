import { useState, useEffect, useRef, useMemo } from "react";
import { Lock, KeyRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

interface Tab {
  id: "home" | "puzzle" | "info";
  emoji: string;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [clickedTab, setClickedTab] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = useMemo(
    () => [
      { id: "home", emoji: "⌂" },
      { id: "puzzle", emoji: "✦" },
      { id: "info", emoji: "☉" },
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
    setTimeout(() => setClickedTab(null), 400);
    onTabChange(tab);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/30 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
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

        {/* Emoji navigation */}
        <div className="relative flex items-center">
          {/* Floating active indicator */}
          <div
            className="absolute h-[calc(100%-6px)] top-[3px] rounded-full bg-primary/15 border border-primary/20"
            style={{
              left: indicatorStyle.left + 2,
              width: indicatorStyle.width - 4,
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 0 16px hsl(var(--primary) / 0.25)",
            }}
          />

          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex items-center justify-center w-11 h-9 rounded-full transition-all duration-300"
            >
              <span
                className={`text-lg transition-all duration-300 select-none ${
                  activeTab === tab.id
                    ? "scale-125 drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                    : "scale-100 opacity-60 hover:opacity-90 hover:scale-110"
                } ${clickedTab === tab.id ? "animate-[bounce_0.4s_ease-out]" : ""}`}
                style={{ filter: activeTab === tab.id ? 'none' : 'grayscale(0.3)' }}
              >
                {tab.emoji}
              </span>
            </button>
          ))}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
