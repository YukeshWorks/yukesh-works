import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import SnakeGame from "@/components/SnakeGame";
import InfoSection from "@/components/InfoSection";
import PasswordLockPage from "@/components/PasswordLockPage";
import LoadingScreen from "@/components/LoadingScreen";
import GlitchOverlay from "@/components/GlitchOverlay";
import VHSNoiseOverlay from "@/components/VHSNoiseOverlay";
import OfflinePage from "@/components/OfflinePage";

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflinePage, setShowOfflinePage] = useState(!navigator.onLine);
  
  const idleTimerRef = useRef<NodeJS.Timeout>();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Don't auto-close offline page, let user decide
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflinePage(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Simple CSS-based cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(
        target.tagName === "BUTTON" || 
        target.tagName === "A" || 
        !!target.closest("button") || 
        !!target.closest("a")
      );
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
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

  // Show offline page when offline and not dismissed
  if (showOfflinePage && !isOnline) {
    return <OfflinePage onClose={() => setShowOfflinePage(false)} />;
  }

  return (
    <div className={`min-h-screen bg-background cursor-none md:cursor-none transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isIdle ? 'idle-breathing' : ''}`}>
      {/* Glitch transition overlay */}
      <GlitchOverlay isActive={isTransitioning} />
      
      {/* VHS noise overlay for retro vibes */}
      <VHSNoiseOverlay />
      
      {/* Custom cursor - CSS transition based */}
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block mix-blend-difference"
        style={{
          transform: `translate(${cursorPosition.x - 8}px, ${cursorPosition.y - 8}px)`,
          transition: 'transform 0.08s linear',
        }}
      >
        <div 
          className={`w-4 h-4 rounded-full border border-white/90 ${
            isHovering ? "scale-[2] opacity-40" : "scale-100 opacity-80"
          }`}
          style={{ transition: 'transform 0.15s ease-out, opacity 0.15s ease-out' }}
        />
      </div>
      <div 
        className="fixed pointer-events-none z-[100] hidden md:block"
        style={{
          transform: `translate(${cursorPosition.x - 2}px, ${cursorPosition.y - 2}px)`,
          transition: 'transform 0.05s linear',
        }}
      >
        <div 
          className={`w-1 h-1 rounded-full bg-primary ${isHovering ? "scale-0" : "scale-100"}`}
          style={{ 
            boxShadow: '0 0 6px hsl(var(--primary))',
            transition: 'transform 0.1s ease-out',
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
