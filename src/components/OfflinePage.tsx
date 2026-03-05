import { useState, useEffect } from "react";
import { X, WifiOff, CloudOff } from "lucide-react";
import offlineCloud from "@/assets/offline-cloud.gif";

const OfflinePage = ({ onClose }: { onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imgOk, setImgOk] = useState(false);

  useEffect(() => { setTimeout(() => setIsVisible(true), 50); }, []);

  useEffect(() => {
    const img = new Image();
    img.src = offlineCloud;
    img.onload = () => setImgOk(true);
    const t = setTimeout(() => setImgOk(prev => prev), 500);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 300); };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1a1a1a]"
      style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.3s ease-out", transform: "translateZ(0)" }}>

      <button onClick={handleClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(-20px)", transition: "all 0.4s ease-out", transitionDelay: "200ms" }}>
        <X className="w-5 h-5 text-white/80" />
      </button>

      <div className="relative z-10 flex flex-col items-center gap-6"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)", transition: "all 0.5s ease-out", transitionDelay: "100ms" }}>
        <div className="relative">
          {imgOk ? (
            <img src={offlineCloud} alt="Offline" className="w-32 h-32 md:w-40 md:h-40 rounded-2xl"
              style={{ filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.5))", border: "3px solid rgba(255,255,255,0.2)" }} />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/5 flex items-center justify-center"
              style={{ border: "3px solid rgba(255,255,255,0.2)" }}>
              <CloudOff className="w-16 h-16 text-white/40" />
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-destructive flex items-center justify-center border-2 border-white/30">
            <WifiOff className="w-5 h-5 text-destructive-foreground" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white/90 tracking-tight text-center" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}>
          You're Offline
        </h2>
        <p className="text-white/50 text-sm text-center max-w-xs">Check your internet connection and try again</p>

        <button onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform duration-200 border-2 border-white/20"
          style={{ boxShadow: "3px 3px 0px rgba(0,0,0,0.3)" }}>
          Try Again
        </button>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease-out", transitionDelay: "300ms" }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">No Internet Connection</span>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
