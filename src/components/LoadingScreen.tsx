import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";
import mobileBg from "@/assets/mobile-bg.jpg";
import profileImg from "@/assets/profile.jpg";
import skullLoading from "@/assets/skull-loading.gif";
import offlineCloud from "@/assets/offline-cloud.gif";
import loadingCar from "@/assets/loading-car.gif";
import artFlame from "@/assets/art-flame.gif";
import artHand from "@/assets/art-hand.gif";
import artNoir from "@/assets/art-noir.gif";
import artSpy from "@/assets/art-spy.gif";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Preload ALL critical assets with progress tracking
  useEffect(() => {
    // Detect if mobile to prioritize correct background
    const isMobile = window.innerWidth < 768;
    
    // Priority order: mobile bg first on mobile, desktop bg first on desktop
    const priorityImages = isMobile 
      ? [mobileBg, homeBg] 
      : [homeBg, mobileBg];
    
    const otherImages = [
      profileImg,
      offlineCloud,
      loadingCar,
      artFlame,
      artHand,
      artNoir,
      artSpy,
    ];
    
    const allImages = [...priorityImages, ...otherImages];
    let loaded = 0;
    const startTime = Date.now();
    const totalAssets = allImages.length;

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loaded++;
          setProgress(Math.round((loaded / totalAssets) * 100));
          resolve();
        };
        img.onerror = () => {
          loaded++;
          setProgress(Math.round((loaded / totalAssets) * 100));
          resolve();
        };
      });
    };

    // Preload fonts
    const preloadFonts = async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
    };

    // Load images sequentially for priority, then rest in parallel
    const loadAllAssets = async () => {
      // Load priority background first
      await preloadImage(priorityImages[0]);
      
      // Load rest in parallel
      await Promise.all([
        preloadImage(priorityImages[1]),
        ...otherImages.map(preloadImage),
        preloadFonts()
      ]);
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1500 - elapsed); // 1.5s minimum

      setTimeout(() => {
        setImagesLoaded(true);
        setFadeOut(true);
        setTimeout(onLoadComplete, 400);
      }, remaining);
    };

    loadAllAssets();
  }, [onLoadComplete]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-400 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: "#b8ada3" }}
    >
      {/* Corner brackets frame - cartoon style */}
      <div className="absolute inset-6 md:inset-12 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-black/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-black/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-black/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-black/30 rounded-br-lg" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Animated spy GIF - smaller */}
        <div className="relative">
          <img
            src={skullLoading}
            alt="Loading"
            className="w-28 h-28 md:w-36 md:h-36 rounded-2xl"
            style={{
              filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.15))",
            }}
          />
        </div>

        {/* Progress bar */}
        <div className="w-32 md:w-40 h-2 bg-black/10 rounded-full overflow-hidden border-2 border-black/20">
          <div
            className="h-full bg-black/40 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading indicator - cartoon style */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border-2 border-black/20"
                style={{
                    backgroundColor: "rgba(0,0,0,0.3)",
                    animation: "cartoonBounce 0.8s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p
            className="text-sm font-black tracking-wider uppercase"
            style={{
              color: "#4a4340",
              textShadow: "1px 1px 0px rgba(255,255,255,0.2)",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {imagesLoaded ? "READY!" : `${progress}%`}
          </p>
        </div>
      </div>


      <style>{`
        @keyframes cartoonBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
