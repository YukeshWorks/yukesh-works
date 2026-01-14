import { useState, useEffect } from "react";
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

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
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
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  const handleTabChange = (tab: "home" | "character" | "puzzle" | "info") => {
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
    }, 300);
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
    <div className="min-h-screen bg-background cursor-none md:cursor-none">
      {/* Custom cursor - desktop only */}
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block transition-transform duration-150 ease-out"
        style={{
          left: cursorPosition.x - 10,
          top: cursorPosition.y - 10,
        }}
      >
        <div 
          className={`w-5 h-5 rounded-full border-2 border-primary transition-all duration-200 ${
            isHovering ? "scale-150 bg-primary/20" : "scale-100"
          }`}
        />
      </div>
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block transition-all duration-75"
        style={{
          left: cursorPosition.x - 3,
          top: cursorPosition.y - 3,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>

      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
        {renderPage()}
      </div>
    </div>
  );
};

export default Index;
