import { useState, useEffect, useCallback } from "react";
import { Flame, Snowflake, Moon } from "lucide-react";

type Theme = "blue" | "red" | "dark";

const themeList: { id: Theme; label: string }[] = [
  { id: "blue", label: "Ice/Black" },
  { id: "red", label: "Fire/Black" },
  { id: "dark", label: "Void" },
];

const iconMap: Record<Theme, React.ReactNode> = {
  blue: <Snowflake className="w-4 h-4" />,
  red: <Flame className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
};

const getActiveTheme = (): Theme => {
  const root = document.documentElement;
  if (root.classList.contains("theme-red")) return "red";
  if (root.classList.contains("theme-dark")) return "dark";
  return "blue";
};

const ThemeToggle = ({ onThemeChange }: { onThemeChange?: (t: Theme) => void }) => {
  const [current, setCurrent] = useState<Theme>("blue");
  const [anim, setAnim] = useState(false);

  // Sync state with actual DOM theme class
  const syncTheme = useCallback(() => {
    setCurrent(getActiveTheme());
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio-theme") as Theme;
    if (saved && themeList.find(t => t.id === saved)) { setCurrent(saved); apply(saved); }
    else { syncTheme(); }

    // Watch for external theme class changes via MutationObserver
    const observer = new MutationObserver(() => {
      syncTheme();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [syncTheme]);

  const apply = (t: Theme) => {
    const r = document.documentElement;
    r.classList.remove("theme-blue", "theme-red", "theme-dark");
    r.classList.add(`theme-${t}`);
    onThemeChange?.(t);
  };

  const cycle = () => {
    setAnim(true);
    const next = themeList[(themeList.findIndex(t => t.id === current) + 1) % themeList.length].id;
    setTimeout(() => { setCurrent(next); localStorage.setItem("portfolio-theme", next); apply(next); setTimeout(() => setAnim(false), 400); }, 200);
  };

  const data = themeList.find(t => t.id === current)!;

  return (
    <button onClick={cycle} className="relative flex items-center justify-center w-10 h-10 glass rounded-full hover:scale-110 transition-all duration-500 group overflow-hidden" title={`Theme: ${data.label}`}>
      <div className={`text-primary transition-all duration-500 ease-out ${anim ? "scale-0 rotate-180 opacity-0" : "scale-100 rotate-0 opacity-100"}`}>
        {iconMap[current]}
      </div>
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }} />
    </button>
  );
};

export default ThemeToggle;
