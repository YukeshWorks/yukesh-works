import { useState, useEffect } from "react";

type Theme = "blue" | "red" | "dark" | "light";

const themes: { id: Theme; icon: string; label: string }[] = [
  { id: "blue", icon: "💙", label: "Blue/Black" },
  { id: "red", icon: "❤️", label: "Red/Black" },
  { id: "dark", icon: "🌙", label: "Dark" },
  { id: "light", icon: "☀️", label: "Light" },
];

interface ThemeToggleProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeToggle = ({ onThemeChange }: ThemeToggleProps) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>("blue");
  const [isOpen, setIsOpen] = useState(false);

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
    root.classList.remove("theme-blue", "theme-red", "theme-dark", "theme-light");
    root.classList.add(`theme-${theme}`);
    
    onThemeChange?.(theme);
  };

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex].id;
    
    setCurrentTheme(nextTheme);
    localStorage.setItem("portfolio-theme", nextTheme);
    applyTheme(nextTheme);
  };

  const currentThemeData = themes.find(t => t.id === currentTheme)!;

  return (
    <button
      onClick={cycleTheme}
      className="relative flex items-center justify-center w-10 h-10 glass rounded-full hover:scale-110 transition-all duration-300 group"
      title={`Theme: ${currentThemeData.label} (Click to change)`}
    >
      <span className="text-lg group-hover:animate-pulse transition-all">
        {currentThemeData.icon}
      </span>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {currentThemeData.label}
      </div>
    </button>
  );
};

export default ThemeToggle;
