import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import SnakeGame from "@/components/SnakeGame";
import InfoSection from "@/components/InfoSection";
import PasswordLockPage from "@/components/PasswordLockPage";
import LoadingScreen from "@/components/LoadingScreen";
import OfflinePage from "@/components/OfflinePage";
import WelcomePage from "@/components/WelcomePage";

type AppPhase = "loading" | "lock" | "welcome" | "main";

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [activeTab, setActiveTab] = useState<"home" | "puzzle" | "info">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev">("next");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflinePage, setShowOfflinePage] = useState(!navigator.onLine);
  const [showPasswordLock, setShowPasswordLock] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout>();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => { setIsOnline(false); setShowOfflinePage(true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const tabOrder = ["home", "puzzle", "info"] as const;

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Loading complete → show lock screen
  const handleLoadComplete = () => {
    setPhase("lock");
    setTimeout(() => setIsLoaded(true), 50);
  };

  // Password unlocked → show welcome page, then main
  const handlePasswordUnlock = () => {
    setPhase("welcome");
    setTimeout(() => setPhase("main"), 4000);
  };

  const handleTabChange = (tab: "home" | "puzzle" | "info") => {
    if (tab === activeTab) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    setTransitionDirection(newIndex > currentIndex ? "next" : "prev");
    setShowPasswordLock(false);
    setIsTransitioning(true);
    setTimeout(() => { setActiveTab(tab); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handleLockClick = () => {
    setTransitionDirection("next");
    setIsTransitioning(true);
    setTimeout(() => { setShowPasswordLock(true); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handlePasswordBack = () => {
    setTransitionDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => { setShowPasswordLock(false); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const renderPage = () => {
    if (showPasswordLock) {
      return <PasswordLockPage onBack={handlePasswordBack} onUnlock={() => setShowPasswordLock(false)} />;
    }
    switch (activeTab) {
      case "home": return <HomePage />;
      case "puzzle": return <SnakeGame />;
      case "info": return <InfoSection />;
      default: return <HomePage />;
    }
  };

  const getTransitionClasses = () => isTransitioning ? "page-fade-exit" : "page-fade-enter";

  // Phase: Loading
  if (phase === "loading") {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }

  // Offline
  if (showOfflinePage && !isOnline) {
    return <OfflinePage onClose={() => setShowOfflinePage(false)} />;
  }

  // Phase: Lock screen (mandatory gate)
  if (phase === "lock") {
    return (
      <div className={`min-h-screen bg-background transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <PasswordLockPage onBack={() => {}} onUnlock={handlePasswordUnlock} />
      </div>
    );
  }

  // Phase: Welcome page
  if (phase === "welcome") {
    return <WelcomePage />;
  }

  // Phase: Main app
  return (
    <div className={`min-h-screen bg-background transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isIdle ? 'idle-breathing' : ''}`}>
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} onLockClick={handleLockClick} />
      <div className="page-container" style={{ perspective: '1500px' }}>
        <div className={getTransitionClasses()}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default Index;
