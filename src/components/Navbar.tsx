import { Lock, KeyRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  activeTab: "home" | "character" | "puzzle" | "info";
  onTabChange: (tab: "home" | "character" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / Lock */}
            {activeTab === "puzzle" ? (
              <button 
                onClick={onLockClick}
                className="relative font-display text-lg md:text-xl font-bold flex items-center justify-center w-10 h-10 rounded-lg glass hover:scale-110 transition-all duration-500 group"
              >
                <div className="relative">
                  <KeyRound className="w-5 h-5 md:w-6 md:h-6 text-primary transition-all duration-300 group-hover:rotate-12" />
                  <Lock className="absolute -bottom-1 -right-1 w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
                    boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
                  }}
                />
              </button>
            ) : (
              <div className="font-display text-lg md:text-xl font-bold gradient-text">
                42
              </div>
            )}
            <ThemeToggle />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <button
              onClick={() => onTabChange("home")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "home" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Home
            </button>
            <button
              onClick={() => onTabChange("character")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "character" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Character
            </button>
            <button
              onClick={() => onTabChange("puzzle")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "puzzle" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Puzzle
            </button>
            <button
              onClick={() => onTabChange("info")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "info" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Info
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
