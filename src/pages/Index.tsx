import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import CharacterPage from "@/components/CharacterPage";
import PuzzlePage from "@/components/PuzzlePage";
import InfoSection from "@/components/InfoSection";
import PasswordLockPage from "@/components/PasswordLockPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "character" | "puzzle" | "info">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev">("next");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPasswordLock, setShowPasswordLock] = useState(false);
  const cursorRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const tabOrder = ["home", "character", "puzzle", "info"] as const;

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Smooth cursor animation with improved easing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };

    const animateCursor = () => {
      setCursorPosition(prev => ({
        x: prev.x + (cursorRef.current.x - prev.x) * 0.12,
        y: prev.y + (cursorRef.current.y - prev.y) * 0.12,
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
    
    // Determine direction for page turn
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    setTransitionDirection(newIndex > currentIndex ? "next" : "prev");
    
    setShowPasswordLock(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 600);
  };

  const handleLockClick = () => {
    setTransitionDirection("next");
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPasswordLock(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 500);
  };

  const handlePasswordBack = () => {
    setTransitionDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPasswordLock(false);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 500);
  };

  const handlePasswordUnlock = () => {
    // Secret unlock action - could navigate somewhere special
    setShowPasswordLock(false);
  };

  const renderPage = () => {
    if (showPasswordLock) {
      return <PasswordLockPage onBack={handlePasswordBack} onUnlock={handlePasswordUnlock} />;
    }

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

  // Page turn animation classes
  const getTransitionClasses = () => {
    if (!isTransitioning) {
      return "page-turn-enter";
    }
    return transitionDirection === "next" ? "page-turn-exit-next" : "page-turn-exit-prev";
  };

  return (
    <div className={`min-h-screen bg-background cursor-none md:cursor-none transition-all duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Custom cursor - desktop only with smoother animation */}
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block mix-blend-difference"
        style={{
          left: cursorPosition.x - 20,
          top: cursorPosition.y - 20,
          transition: 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div 
          className={`w-10 h-10 rounded-full border border-white/80 transition-all duration-500 ease-out ${
            isHovering ? "scale-[2] opacity-50" : "scale-100 opacity-100"
          }`}
        />
      </div>
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block"
        style={{
          left: cursorPosition.x - 3,
          top: cursorPosition.y - 3,
        }}
      >
        <div 
          className={`w-1.5 h-1.5 rounded-full bg-primary transition-all duration-300 ${
            isHovering ? "scale-0" : "scale-100"
          }`}
          style={{
            boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)',
          }}
        />
      </div>

      <Navbar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLockClick={handleLockClick}
      />
      
      {/* Page container with 3D perspective for page turn effect */}
      <div 
        className="page-container"
        style={{ perspective: '2000px', perspectiveOrigin: '50% 50%' }}
      >
        <div className={getTransitionClasses()}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default Index;
