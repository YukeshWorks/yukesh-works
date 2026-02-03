import { useState, useEffect, useRef } from "react";
import { Lock, KeyRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const tabs = [
    { id: "home" as const, label: "Home" },
    { id: "puzzle" as const, label: "Puzzle" },
    { id: "info" as const, label: "Info" },
  ];

  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const activeRef = tabRefs.current[activeIndex];
    if (activeRef) {
      setIndicatorStyle({
        left: activeRef.offsetLeft,
        width: activeRef.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-2xl bg-background/60 backdrop-blur-2xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* Logo */}
        {activeTab === "puzzle" ? (
          <button 
            onClick={onLockClick}
            className="relative w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors duration-300 group"
          >
            <KeyRound className="w-4 h-4 text-primary" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-2 h-2 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold gradient-text font-mono">42</span>
          </div>
        )}

        {/* Nav items with sliding underline */}
        <div className="relative flex items-center">
          {/* Sliding indicator */}
          <div 
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-primary via-primary to-primary/50 rounded-full"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 8px hsl(var(--primary) / 0.6)',
            }}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-2 text-[11px] font-medium tracking-wider uppercase transition-all duration-300 ${
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
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
