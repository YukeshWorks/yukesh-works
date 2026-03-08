import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import VaultPage from "@/components/VaultPage";
import InfoSection from "@/components/InfoSection";
import PasswordLockPage from "@/components/PasswordLockPage";
import LoadingScreen from "@/components/LoadingScreen";
import OfflinePage from "@/components/OfflinePage";
import WelcomePage from "@/components/WelcomePage";
import ParticleBackground from "@/components/ParticleBackground";
import CursorLight from "@/components/CursorLight";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "puzzle" | "info">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev">("next");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflinePage, setShowOfflinePage] = useState(!navigator.onLine);
  const [showPasswordLock, setShowPasswordLock] = useState(false);
  const [showWelcomePage, setShowWelcomePage] = useState(false);

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

  const handleLoadComplete = () => {
    setIsLoading(false);
    setTimeout(() => setIsLoaded(true), 50);
  };

  const handleTabChange = (tab: "home" | "puzzle" | "info") => {
    if (tab === activeTab && !showPasswordLock && !showWelcomePage) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    setTransitionDirection(newIndex > currentIndex ? "next" : "prev");
    setShowPasswordLock(false);
    setShowWelcomePage(false);
    setIsTransitioning(true);
    setTimeout(() => { setActiveTab(tab); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handleLockClick = () => {
    setTransitionDirection("next");
    setIsTransitioning(true);
    setTimeout(() => { setShowPasswordLock(true); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handlePasswordUnlock = () => {
    setTransitionDirection("next");
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPasswordLock(false);
      setShowWelcomePage(true);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handlePasswordBack = () => {
    setTransitionDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => { setShowPasswordLock(false); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handleWelcomeBack = () => {
    setTransitionDirection("prev");
    setIsTransitioning(true);
    setTimeout(() => { setShowWelcomePage(false); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const renderPage = () => {
    if (showWelcomePage) {
      return <WelcomePage onBack={handleWelcomeBack} />;
    }
    if (showPasswordLock) {
      return <PasswordLockPage onBack={handlePasswordBack} onUnlock={handlePasswordUnlock} />;
    }
    switch (activeTab) {
      case "home": return <HomePage />;
      case "puzzle": return <VaultPage />;
      case "info": return <InfoSection />;
      default: return <HomePage />;
    }
  };

  const getTransitionClasses = () => isTransitioning ? "page-fade-exit" : "page-fade-enter";

  if (isLoading) {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }

  if (showOfflinePage && !isOnline) {
    return <OfflinePage onClose={() => setShowOfflinePage(false)} />;
  }

  return (
    <div className={`min-h-screen bg-background transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isIdle ? 'idle-breathing' : ''}`}>
      <ParticleBackground />
      <CursorLight />
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
