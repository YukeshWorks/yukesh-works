import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import LoadingScreen from "@/components/LoadingScreen";
import OfflinePage from "@/components/OfflinePage";
import ParticleBackground from "@/components/ParticleBackground";
import CursorLight from "@/components/CursorLight";
import ethernetVideo from "@/assets/ethernet-video.mp4";
import { onNavigate, peekPending, clearPending, trackTab, unlock, type NavRequest } from "@/lib/siteEvents";

/*
 * Each deploy renames the code chunks. A browser (Instagram's in-app browser in particular)
 * that cached the old page asks for chunk names that no longer exist, so a lazy page never
 * loads. When that happens, reload once with a cache-busting query to get the fresh site;
 * if it still fails, show a tap-to-reload message instead of a blank screen.
 */
const RELOAD_KEY = "yw-chunk-reload";
const freshReload = () => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false;
    sessionStorage.setItem(RELOAD_KEY, "1");
  } catch { /* storage blocked: still try once */ }
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString(36));
  window.location.replace(url.toString());
  return true;
};

const LoadFailed = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
    <p className="text-white/70 text-sm">This page didn't load — the site was just updated.</p>
    <button
      type="button"
      onClick={() => {
        try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
        freshReload();
      }}
      className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.06] text-sm text-white"
    >
      Tap to reload
    </button>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyPage = <T extends React.ComponentType<any>>(load: () => Promise<{ default: T }>) =>
  lazy(() =>
    load().catch(() => {
      // Reloading: keep showing the fallback until the new page arrives.
      if (freshReload()) return new Promise<{ default: T }>(() => {});
      return { default: LoadFailed as unknown as T };
    }),
  );

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    freshReload();
  });
  // Tidy the cache-busting tag out of the address bar.
  const here = new URL(window.location.href);
  if (here.searchParams.has("v")) {
    here.searchParams.delete("v");
    window.history.replaceState(null, "", here.pathname + here.search + here.hash);
  }
  // A successful load clears the guard so a future deploy can trigger one reload again.
  window.addEventListener("load", () => {
    window.setTimeout(() => { try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ } }, 10000);
  });
}

const VaultPage = lazyPage(() => import("@/components/VaultPage"));
const InfoSection = lazyPage(() => import("@/components/InfoSection"));
const PasswordLockPage = lazyPage(() => import("@/components/PasswordLockPage"));
const WelcomePage = lazyPage(() => import("@/components/WelcomePage"));

// Warm the lazy chunks once the home screen is idle so tab switches stay instant.
const prefetchPages = () => {
  const ignore = () => {};
  import("@/components/VaultPage").catch(ignore);
  import("@/components/InfoSection").catch(ignore);
  import("@/components/PasswordLockPage").catch(ignore);
  import("@/components/WelcomePage").catch(ignore);
};

const getAudioContext = (): AudioContext | null => {
  const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "puzzle" | "info">("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev">("next");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflinePage, setShowOfflinePage] = useState(!navigator.onLine);
  const [showPasswordLock, setShowPasswordLock] = useState(false);
  const [showWelcomePage, setShowWelcomePage] = useState(false);
  const [show42Video, setShow42Video] = useState(false);
  const [sweep, setSweep] = useState(0);
  const [show42Warning, setShow42Warning] = useState(false);
  const tapped42Ref = useRef(false);
  const prevThemeRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playWarningSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Eerie descending tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start();
      osc.stop(ctx.currentTime + 1);
      // Static burst
      const bufSize = ctx.sampleRate * 0.15;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
      const ns = ctx.createBufferSource();
      const ng = ctx.createGain();
      ns.buffer = buf;
      ns.connect(ng);
      ng.connect(ctx.destination);
      ng.gain.setValueAtTime(0.1, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      ns.start();
    } catch (error) {
      console.warn("Browser audio is unavailable:", error);
    }
  }, []);

  const playVideoEntrySound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Deep impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      // Glitch noise
      const bufSize = ctx.sampleRate * 0.3;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
      const ns = ctx.createBufferSource();
      const ng = ctx.createGain();
      ns.buffer = buf;
      ns.connect(ng);
      ng.connect(ctx.destination);
      ng.gain.setValueAtTime(0.12, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      ns.start();
    } catch (error) {
      console.warn("Browser audio is unavailable:", error);
    }
  }, []);

  const handle42Click = useCallback(() => {
    if (!tapped42Ref.current) {
      tapped42Ref.current = true;
      setShow42Warning(true);
      playWarningSound();
      setTimeout(() => setShow42Warning(false), 2500);
    } else {
      playVideoEntrySound();
      setShow42Video(true);
      unlock("forty-two");
    }
  }, [playWarningSound, playVideoEntrySound]);

  const handle42VideoEnd = useCallback(() => {
    setShow42Video(false);
    tapped42Ref.current = false;
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
      // Restore user's saved theme (or default blue) when back to home
      const savedTheme = localStorage.getItem("portfolio-theme") || "blue";
      root.classList.remove("theme-blue", "theme-red", "theme-dark");
      root.classList.add(`theme-${savedTheme}`);
      prevThemeRef.current = null;
    }
  }, [activeTab]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => { setIsOnline(false); setShowOfflinePage(true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const tabOrder = ["home", "puzzle", "info"] as const;

  useEffect(() => {
    if (isLoading) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(prefetchPages);
    else window.setTimeout(prefetchPages, 1500);
  }, [isLoading]);

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setIsLoaded(true)));
  }, []);

  const handleTabChange = (tab: "home" | "puzzle" | "info") => {
    if (tab === activeTab && !showPasswordLock && !showWelcomePage) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    setTransitionDirection(newIndex > currentIndex ? "next" : "prev");
    setShowPasswordLock(false);
    setShowWelcomePage(false);
    setSweep(k => k + 1);
    setIsTransitioning(true);
    setTimeout(() => { setActiveTab(tab); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handleLockClick = () => {
    setTransitionDirection("next");
    setSweep(k => k + 1);
    setIsTransitioning(true);
    setTimeout(() => { setShowPasswordLock(true); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handlePasswordUnlock = () => {
    unlock("agent");
    setTransitionDirection("next");
    setSweep(k => k + 1);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPasswordLock(false);
      setShowWelcomePage(true);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handlePasswordBack = () => {
    setTransitionDirection("prev");
    setSweep(k => k + 1);
    setIsTransitioning(true);
    setTimeout(() => { setShowPasswordLock(false); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  const handleWelcomeBack = () => {
    setTransitionDirection("prev");
    setSweep(k => k + 1);
    setIsTransitioning(true);
    setTimeout(() => { setShowWelcomePage(false); setTimeout(() => setIsTransitioning(false), 50); }, 200);
  };

  // Achievements: tabs visited, late-night visit.
  useEffect(() => { if (!isLoading) trackTab(activeTab); }, [activeTab, isLoading]);
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 0 && h < 5) unlock("night-owl");
  }, []);

  // Requests from the command palette.
  const handleNav = (req: NavRequest) => {
    if (req.kind === "tab") { clearPending(); handleTabChange(req.tab); return; }
    if (req.kind === "lock") { clearPending(); handleLockClick(); return; }
    // Games: switch to the Vault; VaultPage picks up the pending request when it mounts.
    if (activeTab !== "puzzle" || showPasswordLock || showWelcomePage) handleTabChange("puzzle");
  };
  const navRef = useRef(handleNav);
  navRef.current = handleNav;
  useEffect(() => onNavigate(r => { if (!isLoading) navRef.current(r); }), [isLoading]);
  useEffect(() => {
    if (isLoading) return;
    const p = peekPending();
    if (p) window.setTimeout(() => navRef.current(p), 300);
  }, [isLoading]);

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
    <div className={`min-h-screen bg-background transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Only Home lets the particles show through; elsewhere opaque pages cover them, so skip the work. */}
      {activeTab === "home" && !showPasswordLock && !showWelcomePage && <ParticleBackground />}
      <CursorLight />
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} onLockClick={handleLockClick} on42Click={handle42Click} />
      {sweep > 0 && (
        <div key={sweep} className={`tab-sweep ${transitionDirection === "prev" ? "tab-sweep-prev" : ""}`} aria-hidden="true">
          <div className="tab-sweep-panel" />
          <div className="tab-sweep-edge" />
        </div>
      )}
      <div className="page-container" style={{ perspective: '1500px' }}>
        <div className={getTransitionClasses()}>
          <Suspense fallback={<div className="min-h-screen" />}>
            {renderPage()}
          </Suspense>
        </div>
      </div>

      {/* Warning toast on first 42 tap */}
      {show42Warning && (
        <div className="fixed top-20 left-1/2 z-[9998]" style={{
          animation: 'warn42Pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}>
          <div className="relative px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(15, 0, 0, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              boxShadow: '0 0 16px rgba(220, 38, 38, 0.2)',
              animation: 'warn42Shake 0.5s ease-in-out 0.2s, warn42Pulse 1.5s ease-in-out infinite 0.7s',
            }}
          >
            <p className="text-red-400 text-[10px] font-display tracking-[0.15em] uppercase text-center whitespace-nowrap"
              style={{ textShadow: '0 0 8px rgba(220, 38, 38, 0.6)' }}>
              ⚠ Don't touch again
            </p>
          </div>
        </div>
      )}

      {/* Fullscreen 42 video overlay */}
      {show42Video && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={handle42VideoEnd}
          style={{ animation: 'video42Enter 0.4s ease-out forwards' }}
        >
          {/* Glitch lines */}
          <div className="absolute inset-0 pointer-events-none z-10" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
            animation: 'video42Scanlines 0.1s steps(2) infinite',
          }} />
          <video
            ref={videoRef}
            src={ethernetVideo}
            autoPlay
            playsInline
            muted
            onEnded={handle42VideoEnd}
            className="w-full h-full object-cover"
            style={{ animation: 'video42Zoom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          />
        </div>
      )}

      <style>{`
        @keyframes warn42Enter {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.8); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes warn42Flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes warn42Pop {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.7); }
          60% { transform: translateX(-50%) translateY(2px) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes warn42Shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-4px) rotate(-1deg); }
          30% { transform: translateX(4px) rotate(1deg); }
          45% { transform: translateX(-3px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(1px); }
        }
        @keyframes warn42Pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(220,38,38,0.15); }
          50% { box-shadow: 0 0 20px rgba(220,38,38,0.3); }
        }
        @keyframes video42Enter {
          0% { opacity: 0; clip-path: inset(50% 0 50% 0); }
          30% { opacity: 1; clip-path: inset(20% 0 20% 0); }
          100% { opacity: 1; clip-path: inset(0 0 0 0); }
        }
        @keyframes video42Zoom {
          0% { transform: scale(1.3); filter: brightness(2) contrast(1.5); }
          100% { transform: scale(1); filter: brightness(1) contrast(1); }
        }
        @keyframes video42Scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
};

export default Index;
