import { useState, useEffect, useRef, useCallback } from "react";
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
import ethernetVideo from "@/assets/ethernet-video.mp4";

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
  const [show42Video, setShow42Video] = useState(false);
  const prevThemeRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handle42Click = useCallback(() => {
    setShow42Video(true);
  }, []);

  const handle42VideoEnd = useCallback(() => {
    setShow42Video(false);
  }, []);

  // Auto-switch theme based on active tab
  useEffect(() => {
    const root = document.documentElement;
    if (activeTab === "info" || activeTab === "puzzle") {
      // Save current theme before switching
      if (!prevThemeRef.current) {
        const currentTheme = ["theme-blue", "theme-red", "theme-dark"].find(c => root.classList.contains(c)) || "theme-blue";
        prevThemeRef.current = currentTheme;
      }
      root.classList.remove("theme-blue", "theme-red", "theme-dark");
      root.classList.add(activeTab === "info" ? "theme-red" : "theme-dark");
    } else if (prevThemeRef.current) {
      // Restore previous theme when back to home
      root.classList.remove("theme-blue", "theme-red", "theme-dark");
      root.classList.add(prevThemeRef.current);
      prevThemeRef.current = null;
    }
  }, [activeTab]);

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
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} onLockClick={handleLockClick} on42Click={handle42Click} />
      <div className="page-container" style={{ perspective: '1500px' }}>
        <div className={getTransitionClasses()}>
          {renderPage()}
        </div>
      </div>

      {/* Fullscreen 42 video overlay */}
      {show42Video && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={handle42VideoEnd}
          style={{ animation: 'pageFadeIn 0.3s ease-out' }}
        >
          <video
            ref={videoRef}
            src={ethernetVideo}
            autoPlay
            playsInline
            muted
            onEnded={handle42VideoEnd}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default Index;
