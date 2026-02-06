import { useState, useEffect } from "react";
import { X, WifiOff, CloudOff } from "lucide-react";
import offlineCloud from "@/assets/offline-cloud.gif";

interface OfflinePageProps {
  onClose: () => void;
}

const OfflinePage = ({ onClose }: OfflinePageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Try to load image from cache
  useEffect(() => {
    const img = new Image();
    img.src = offlineCloud;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageFailed(true);
    
    // Set timeout - if image doesn't load in 500ms, show fallback
    const timeout = setTimeout(() => {
      if (!imageLoaded) setImageFailed(true);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [imageLoaded]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1a1a1a]"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease-out",
        transform: "translateZ(0)",
      }}
    >
      {/* Close button at top */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(-20px)",
          transition: "all 0.4s ease-out",
          transitionDelay: "200ms",
        }}
      >
        <X className="w-5 h-5 text-white/80" />
      </button>

      {/* Corner brackets frame */}
      <div className="absolute inset-6 md:inset-12 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white/20 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white/20 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white/20 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white/20 rounded-br-lg" />
      </div>

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.5s ease-out",
          transitionDelay: "100ms",
        }}
      >
        {/* Offline icon - show GIF if cached, fallback to icon */}
        <div className="relative">
          {imageLoaded && !imageFailed ? (
            <img
              src={offlineCloud}
              alt="Offline"
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl"
              style={{
                filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.5))",
                border: "3px solid rgba(255,255,255,0.2)",
              }}
            />
          ) : (
            <div 
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/5 flex items-center justify-center"
              style={{
                border: "3px solid rgba(255,255,255,0.2)",
                boxShadow: "4px 4px 0px rgba(0,0,0,0.5)",
              }}
            >
              <CloudOff className="w-16 h-16 md:w-20 md:h-20 text-white/40" />
            </div>
          )}
          {/* Wifi off icon overlay */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-destructive flex items-center justify-center border-2 border-white/30">
            <WifiOff className="w-5 h-5 text-destructive-foreground" />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl md:text-3xl font-black text-white/90 tracking-tight text-center"
          style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}
        >
          You're Offline
        </h2>

        {/* Subtitle */}
        <p className="text-white/50 text-sm md:text-base text-center max-w-xs">
          Check your internet connection and try again
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform duration-200 border-2 border-white/20"
          style={{ boxShadow: "3px 3px 0px rgba(0,0,0,0.3)" }}
        >
          Try Again
        </button>
      </div>

      {/* Bottom message */}
      <div
        className="absolute bottom-8 left-0 right-0 flex justify-center"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s ease-out",
          transitionDelay: "300ms",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
            No Internet Connection
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
