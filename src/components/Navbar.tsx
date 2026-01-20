import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, KeyRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [blobPosition, setBlobPosition] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [morphBlob, setMorphBlob] = useState({ x: 0, y: 0, scale: 1 });
  const navRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  
  const tabs = [
    { id: "home" as const, label: "Home" },
    { id: "puzzle" as const, label: "Puzzle" },
    { id: "info" as const, label: "Info" },
  ];

  useEffect(() => {
    const index = tabs.findIndex(t => t.id === activeTab);
    setBlobPosition(index);
  }, [activeTab]);

  // Smooth blob following with RAF
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return;
    
    const rect = navRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Smooth morphing blob animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setMorphBlob(prev => ({
        x: prev.x + (x - prev.x) * 0.15,
        y: prev.y + (y - prev.y) * 0.15,
        scale: 1 + Math.sin(Date.now() / 300) * 0.1,
      }));
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div 
        ref={navRef}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-full glass backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden navbar-fluid"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Morphing fluid blob that follows mouse */}
        {isHovering && (
          <div 
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: morphBlob.x - 40,
              top: morphBlob.y - 40,
              width: 80,
              height: 80,
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)`,
              borderRadius: '40% 60% 55% 45% / 55% 45% 60% 40%',
              transform: `scale(${morphBlob.scale}) rotate(${Date.now() / 50 % 360}deg)`,
              filter: 'blur(15px)',
              transition: 'left 0.1s ease-out, top 0.1s ease-out',
            }}
          />
        )}

        {/* Logo */}
        {activeTab === "puzzle" ? (
          <button 
            onClick={onLockClick}
            className="relative w-6 h-6 rounded-full glass flex items-center justify-center hover:scale-110 transition-all duration-300 group z-10"
          >
            <KeyRound className="w-3 h-3 text-primary transition-all duration-300 group-hover:rotate-12" />
            <Lock className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </button>
        ) : (
          <div className="w-6 h-6 rounded-full glass flex items-center justify-center z-10 logo-pulse">
            <span className="text-[10px] font-bold gradient-text font-mono">42</span>
          </div>
        )}

        {/* Nav items with fluid blob indicator */}
        <div className="relative flex items-center z-10">
          {/* Animated blob background - more fluid */}
          <div 
            className="absolute h-5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/20 will-change-transform"
            style={{
              width: '44px',
              left: `${blobPosition * 48 + 2}px`,
              boxShadow: '0 0 15px hsl(var(--primary) / 0.2)',
              transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease',
              borderRadius: '40% 60% 55% 45% / 55% 45% 60% 40%',
            }}
          />
          
          {tabs.map((tab, index) => {
            const isNearMouse = isHovering && Math.abs(mousePosition.x - (index * 48 + 60)) < 25;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 px-3 py-0.5 text-[9px] font-medium tracking-wide uppercase transition-all duration-200 ${
                  activeTab === tab.id 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  transform: isNearMouse ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
