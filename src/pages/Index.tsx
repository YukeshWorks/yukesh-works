import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import CharacterPage from "@/components/CharacterPage";
import PuzzlePage from "@/components/PuzzlePage";
import InfoSection from "@/components/InfoSection";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "character" | "puzzle" | "info">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const cursorRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Smooth cursor animation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };

    const animateCursor = () => {
      setCursorPosition(prev => ({
        x: prev.x + (cursorRef.current.x - prev.x) * 0.15,
        y: prev.y + (cursorRef.current.y - prev.y) * 0.15,
      }));
      animationRef.current = requestAnimationFrame(animateCursor);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.tagName === "A" || target.closest("button") || target.closest("a")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    animationRef.current = requestAnimationFrame(animateCursor);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleTabChange = (tab: "home" | "character" | "puzzle" | "info") => {
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 400);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "character":
        return <CharacterPage />;
      case "puzzle":
        return <PuzzlePage />;
      case "info":
        return <InfoSection />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen bg-background cursor-none md:cursor-none transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Custom cursor - desktop only */}
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block"
        style={{
          left: cursorPosition.x - 16,
          top: cursorPosition.y - 16,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div 
          className={`w-8 h-8 rounded-full border-2 border-primary transition-all duration-300 ease-out ${
            isHovering ? "scale-150 bg-primary/20 border-primary/50" : "scale-100"
          }`}
          style={{
            boxShadow: isHovering 
              ? '0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)' 
              : '0 0 10px hsl(var(--primary) / 0.3)',
          }}
        />
      </div>
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block"
        style={{
          left: cursorPosition.x - 4,
          top: cursorPosition.y - 4,
        }}
      >
        <div 
          className="w-2 h-2 rounded-full bg-primary transition-all duration-150"
          style={{
            boxShadow: '0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary) / 0.5)',
          }}
        />
      </div>

      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div 
        className={`transition-all duration-500 ease-out ${
          isTransitioning 
            ? "opacity-0 scale-95 blur-sm translate-y-4" 
            : "opacity-100 scale-100 blur-0 translate-y-0"
        }`}
      >
        {renderPage()}
      </div>
    </div>
  );
};

export default Index;
