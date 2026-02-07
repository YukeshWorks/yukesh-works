import { useState, useEffect, useRef, useMemo } from "react";
import { Home, Puzzle, Info } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import skullLock from "@/assets/skull-lock.gif";

interface NavbarProps {
  activeTab: "home" | "puzzle" | "info";
  onTabChange: (tab: "home" | "puzzle" | "info") => void;
  onLockClick?: () => void;
}

interface Tab {
  id: "home" | "puzzle" | "info";
  label: string;
  icon: typeof Home;
}

const Navbar = ({ activeTab, onTabChange, onLockClick }: NavbarProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = useMemo(
    () => [
      { id: "home", label: "Home", icon: Home },
      { id: "puzzle", label: "Puzzle", icon: Puzzle },
      { id: "info", label: "Info", icon: Info },
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

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-[#c4bab0]/90 dark:bg-[#3a3632]/90 backdrop-blur-md border border-[#b0a69c]/50 dark:border-[#4a4640]/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Skull lock button */}
        <button
          onClick={activeTab === "puzzle" ? onLockClick : undefined}
          className={`relative w-10 h-10 rounded-full bg-[#b8aea4] dark:bg-[#2a2826] flex items-center justify-center transition-all duration-300 overflow-hidden ${
            activeTab === "puzzle" 
              ? "hover:bg-[#a89e94] dark:hover:bg-[#3a3836] cursor-pointer ring-2 ring-black/20 dark:ring-white/10" 
              : ""
          }`}
        >
          <img 
            src={skullLock} 
            alt="Lock" 
            className="w-8 h-8 object-contain"
          />
        </button>

        {/* Segmented pill navigation */}
        <div className="relative flex items-center">
          {/* Floating active indicator pill */}
          <div
            className="absolute h-[calc(100%-6px)] top-[3px] rounded-full bg-[#f5f0eb] dark:bg-[#1a1816] border border-[#d4cec6]/60 dark:border-[#3a3632]/60"
            style={{
              left: indicatorStyle.left + 2,
              width: indicatorStyle.width - 4,
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />

          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium tracking-wider uppercase transition-all duration-300 rounded-full ${
                activeTab === tab.id
                  ? "text-[#1a1816] dark:text-[#f5f0eb]"
                  : "text-[#6a625a] dark:text-[#8a827a] hover:text-[#3a3632] dark:hover:text-[#c4bab0]"
              }`}
            >
              <tab.icon
                className={`w-3.5 h-3.5 transition-all duration-300 ${
                  activeTab === tab.id
                    ? "scale-110"
                    : "scale-100"
                }`}
              />
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
