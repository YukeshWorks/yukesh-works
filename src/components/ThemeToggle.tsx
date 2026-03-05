import { useState, useEffect } from "react";
import { Flame, Snowflake, Moon } from "lucide-react";

type Theme = "blue" | "red" | "dark";

const themes: { id: Theme; icon: React.ReactNode; label: string }[] = [
  { id: "blue", icon: <Snowflake className="w-4 h-4" />, label: "Ice/Black" },
  { id: "red", icon: <Flame className="w-4 h-4" />, label: "Fire/Black" },
  { id: "dark", icon: <Moon className="w-4 h-4" />, label: "Void" },
];

const ThemeToggle = ({ onThemeChange }: { onThemeChange?: (t: Theme) => void }) => {
  const [current, setCurrent] = useState<Theme>("blue");
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio-theme") as Theme;
    if (saved && themes.find(t => t.id === saved)) { setCurrent(saved); apply(saved); }
  }, []);

  const apply = (t: Theme) => {
    const r = document.documentElement;
    r.classList.remove("theme-blue", "theme-red", "theme-dark");
    r.classList.add(`theme-${t}`);
    onThemeChange?.(t);
  };

  const cycle = () => {
    setAnim(true);
    const next = themes[(themes.findIndex(t => t.id === current) + 1) % themes.length].id;
    setTimeout(() => { setCurrent(next); localStorage.setItem("portfolio-theme", next); apply(next); setTimeout(() => setAnim(false), 400); }, 200);
  };

  const data = themes.find(t => t.id === current)!;

  return (
    <button onClick={cycle} className="relative flex items-center justify-center w-10 h-10 glass rounded-full hover:scale-110 transition-all duration-500 group overflow-hidden" title={`Theme: ${data.label}`}>
      <div className={`text-primary transition-all duration-500 ease-out ${anim ? "scale-0 rotate-180 opacity-0" : "scale-100 rotate-0 opacity-100"}`}>
        {data.icon}
      </div>
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }} />
    </button>
  );
};

export default ThemeToggle;
