import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";
import mobileBg from "@/assets/mobile-bg.jpg";
import profileImg from "@/assets/profile.jpg";
import profileHero from "@/assets/profile-hero.webp";
import loadingSpy from "@/assets/loading-spy.gif";
import offlineCloud from "@/assets/offline-cloud.gif";
import loadingCar from "@/assets/loading-car.gif";
import artFlame from "@/assets/art-flame.gif";
import artHand from "@/assets/art-hand.gif";
import artNoir from "@/assets/art-noir.gif";
import artSpy from "@/assets/art-spy.gif";
import pixelEyes from "@/assets/pixel-eyes.gif";
import ambientVideo from "@/assets/ambient-bg.mp4";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const priorityBg = isMobile ? mobileBg : homeBg;

    // ALL image assets used across every page
    const allImages = [
      priorityBg,
      isMobile ? homeBg : mobileBg,
      profileImg, profileHero, offlineCloud, loadingCar,
      artFlame, artHand, artNoir, artSpy, pixelEyes,
    ];

    let loaded = 0;
    // +1 for video, +1 for fonts
    const total = allImages.length + 2;
    const startTime = Date.now();

    const tick = () => {
      loaded++;
      setProgress(Math.round((loaded / total) * 100));
    };

    const loadImage = (src: string) => new Promise<void>(resolve => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => { tick(); resolve(); };
    });

    const loadVideo = (src: string) => new Promise<void>(resolve => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.src = src;
      const done = () => { tick(); resolve(); };
      video.oncanplaythrough = done;
      video.onerror = done;
      // Fallback timeout for slow video
      setTimeout(done, 5000);
    });

    const run = async () => {
      // Load priority bg first
      await loadImage(priorityBg);

      // Load rest in parallel
      await Promise.all([
        ...allImages.slice(1).map(loadImage),
        loadVideo(ambientVideo),
        document.fonts?.ready.then(tick),
      ]);

      // No artificial delay — go immediately
      setReady(true);
      setFadeOut(true);
      setTimeout(onLoadComplete, 200);
    };
    run();
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ backgroundColor: "#f5a442" }}>
      <div className="absolute inset-6 md:inset-12 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-black rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-black rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-black rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-black rounded-br-lg" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <img src={loadingSpy} alt="Loading" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl"
          style={{ filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.3))", border: "3px solid black" }} />

        <div className="w-32 md:w-40 h-2 bg-black/20 rounded-full overflow-hidden border-2 border-black">
          <div className="h-full bg-black rounded-full transition-all duration-200 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full border-2 border-black"
                style={{ backgroundColor: "#1a1a1a", animation: "cartoonBounce 0.8s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-lg tracking-[0.3em] uppercase font-loading"
            style={{ color: "#1a1a1a", textShadow: "2px 2px 0px rgba(255,255,255,0.3)" }}>
            {ready ? "READY!" : `${progress}%`}
          </p>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "#f5a442", opacity: fadeOut ? 1 : 0, transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transform: 'translateZ(0)' }} />

      <style>{`
        @keyframes cartoonBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
