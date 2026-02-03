import { useState, useEffect } from "react";
import { Lock, KeyRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [blobPosition, setBlobPosition] = useState(0);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  
  const tabs = [
    { id: "home" as const, label: "Home" },
    { id: "puzzle" as const, label: "Puzzle" },
    { id: "info" as const, label: "Info" },
  ];

  useEffect(() => {
    const index = tabs.findIndex(t => t.id === activeTab);
    setBlobPosition(index);
  }, [activeTab]);

  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full glass backdrop-blur-xl border border-white/10 shadow-lg relative">
        {/* Logo */}
        {activeTab === "puzzle" ? (
          <button 
            onClick={onLockClick}
            className="relative w-6 h-6 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform duration-200 group z-10"
          >
            <KeyRound className="w-3 h-3 text-primary" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-6 h-6 rounded-full glass flex items-center justify-center z-10">
            <span className="text-[10px] font-bold gradient-text font-mono">42</span>
          </div>
        )}

        {/* Nav items with fluid drop indicator */}
        <div className="relative flex items-center z-10">
          {/* Fluid drop blob */}
          <div 
            className="absolute h-6 bg-primary/20 border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
            style={{
              width: '42px',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              transform: `translateX(${blobPosition * 48 + 3}px)`,
              transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            }}
          />
          {/* Drop tail effect */}
          <div 
            className="absolute h-2 w-2 bg-primary/15 rounded-full"
            style={{
              top: '-4px',
              transform: `translateX(${blobPosition * 48 + 20}px)`,
              transition: 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            }}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(index)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`relative z-10 px-3 py-0.5 text-[9px] font-medium tracking-wide uppercase transition-all duration-200 ${
                activeTab === tab.id 
                  ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{
                transform: hoveredTab === index ? 'scale(1.08) translateY(-1px)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.15s ease',
              }}
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
