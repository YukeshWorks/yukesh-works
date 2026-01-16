import { useState, useEffect } from "react";
import { Flame, Snowflake, Moon } from "lucide-react";

type Theme = "blue" | "red" | "dark";

const themes: { id: Theme; icon: React.ReactNode; label: string }[] = [
  { id: "blue", icon: <Snowflake className="w-4 h-4" />, label: "Ice/Black" },
  { id: "red", icon: <Flame className="w-4 h-4" />, label: "Fire/Black" },
  { id: "dark", icon: <Moon className="w-4 h-4" />, label: "Void" },
];

interface ThemeToggleProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeToggle = ({ onThemeChange }: ThemeToggleProps) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>("blue");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio-theme") as Theme;
    if (saved && themes.find(t => t.id === saved)) {
      setCurrentTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-blue", "theme-red", "theme-dark");
    root.classList.add(`theme-${theme}`);
    
    onThemeChange?.(theme);
  };

  const cycleTheme = () => {
    setIsAnimating(true);
    
    const currentIndex = themes.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex].id;
    
    setTimeout(() => {
      setCurrentTheme(nextTheme);
      localStorage.setItem("portfolio-theme", nextTheme);
      applyTheme(nextTheme);
      
      setTimeout(() => setIsAnimating(false), 400);
    }, 200);
  };

  const currentThemeData = themes.find(t => t.id === currentTheme)!;

  return (
    <button
      onClick={cycleTheme}
      className="relative flex items-center justify-center w-10 h-10 glass rounded-full hover:scale-110 transition-all duration-500 group overflow-hidden"
      title={`Theme: ${currentThemeData.label} (Click to change)`}
    >
      <div 
        className={`text-primary transition-all duration-500 ease-out ${
          isAnimating ? "scale-0 rotate-180 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
      >
        {currentThemeData.icon}
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        {currentThemeData.label}
      </div>
    </button>
  );
};

export default ThemeToggle;
