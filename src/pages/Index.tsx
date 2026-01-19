import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import SnakeGame from "@/components/SnakeGame";
import InfoSection from "@/components/InfoSection";
import PasswordLockPage from "@/components/PasswordLockPage";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "puzzle" | "info">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev">("next");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPasswordLock, setShowPasswordLock] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  
  const cursorRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const idleTimerRef = useRef<NodeJS.Timeout>();

  const tabOrder = ["home", "puzzle", "info"] as const;

  // Reset idle timer on any interaction
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
  };

  // Idle detection
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();
    
    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Loading complete handler
  const handleLoadComplete = () => {
    setShowLoadingScreen(false);
    setTimeout(() => setIsLoaded(true), 50);
  };

  // Smooth cursor animation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };

    const animateCursor = () => {
      setCursorPosition(prev => ({
        x: prev.x + (cursorRef.current.x - prev.x) * 0.2,
        y: prev.y + (cursorRef.current.y - prev.y) * 0.2,
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

  const handleTabChange = (tab: "home" | "puzzle" | "info") => {
    if (tab === activeTab) return;
    
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    setTransitionDirection(newIndex > currentIndex ? "next" : "prev");
    
    setShowPasswordLock(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handleLockClick = () => {
    setTransitionDirection("next");
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPasswordLock(true);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handlePasswordBack = () => {
    setTransitionDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPasswordLock(false);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handlePasswordUnlock = () => {
    setShowPasswordLock(false);
  };

  const renderPage = () => {
    if (showPasswordLock) {
      return <PasswordLockPage onBack={handlePasswordBack} onUnlock={handlePasswordUnlock} />;
    }

    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "puzzle":
        return <SnakeGame />;
      case "info":
        return <InfoSection />;
      default:
        return <HomePage />;
    }
  };

  const getTransitionClasses = () => {
    if (!isTransitioning) return "page-turn-enter";
    return transitionDirection === "next" ? "page-turn-exit-next" : "page-turn-exit-prev";
  };

  // Show loading screen first
  if (showLoadingScreen) {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }

  return (
    <div className={`min-h-screen bg-background cursor-none md:cursor-none transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isIdle ? 'idle-breathing' : ''}`}>
      {/* Custom cursor */}
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block mix-blend-difference"
        style={{
          left: cursorPosition.x - 8,
          top: cursorPosition.y - 8,
        }}
      >
        <div 
          className={`w-4 h-4 rounded-full border border-white/90 transition-transform duration-150 ${
            isHovering ? "scale-[2.5] opacity-40" : "scale-100 opacity-80"
          }`}
        />
      </div>
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block"
        style={{
          left: cursorPosition.x - 2,
          top: cursorPosition.y - 2,
        }}
      >
        <div 
          className={`w-1 h-1 rounded-full bg-primary transition-transform duration-150 ${
            isHovering ? "scale-0" : "scale-100"
          }`}
          style={{
            boxShadow: '0 0 6px hsl(var(--primary)), 0 0 12px hsl(var(--primary) / 0.5)',
          }}
        />
      </div>

      <Navbar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLockClick={handleLockClick}
      />
      
      {/* Page container */}
      <div className="page-container" style={{ perspective: '1500px' }}>
        <div className={getTransitionClasses()}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default Index;
