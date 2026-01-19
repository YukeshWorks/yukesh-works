import { useState, useEffect } from "react";
import { Lock, KeyRound, Sparkles, Zap, Star } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [blobPosition, setBlobPosition] = useState(0);
  
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
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-full glass backdrop-blur-xl border border-white/10 shadow-lg">
        {/* Logo */}
        {activeTab === "puzzle" ? (
          <button 
            onClick={onLockClick}
            className="relative w-7 h-7 rounded-full glass flex items-center justify-center hover:scale-110 transition-all duration-300 group"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary transition-all duration-300 group-hover:rotate-12" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-2 h-2 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </button>
        ) : (
          <div className="w-7 h-7 rounded-full glass flex items-center justify-center">
            <span className="text-xs font-bold gradient-text font-mono">42</span>
          </div>
        )}

        {/* Nav items with blob indicator */}
        <div className="relative flex items-center">
          {/* Animated blob background */}
          <div 
            className="absolute h-6 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 transition-all duration-500 ease-out"
            style={{
              width: '52px',
              left: `${blobPosition * 56 + 4}px`,
              boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
            }}
          />
          
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative z-10 px-3.5 py-1 text-[10px] font-medium tracking-wide uppercase transition-all duration-300 ${
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
        
        {/* Decorative floating icons */}
        <div className="absolute -top-6 -right-4 pointer-events-none">
          <Sparkles className="w-3 h-3 text-primary/40 animate-pulse" />
        </div>
        <div className="absolute -bottom-5 -left-3 pointer-events-none">
          <Star className="w-2.5 h-2.5 text-primary/30 floating-icon" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
