import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";
import mobileBg from "@/assets/mobile-bg.jpg";
import profileImg from "@/assets/profile.jpg";
import loadingSpy from "@/assets/loading-spy.gif";
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

  // Preload ALL critical assets with progress tracking
  useEffect(() => {
    const images = [
      homeBg,
      mobileBg,
      profileImg,
      loadingSpy,
      offlineCloud,
      loadingCar,
      artFlame,
      artHand,
      artNoir,
      artSpy,
    ];
    
    let loaded = 0;
    const startTime = Date.now();
    const totalAssets = images.length;

    const preloadImage = (src: string) => {
      return new Promise<void>((resolve) => {
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

    Promise.all([...images.map(preloadImage), preloadFonts()]).then(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed); // Ensure 2 seconds minimum

      setTimeout(() => {
        setImagesLoaded(true);
        setTimeout(onLoadComplete, 250);
      }, remaining);
    });
  }, [onLoadComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "#f5a442" }}
    >
      {/* Corner brackets frame - cartoon style */}
      <div className="absolute inset-6 md:inset-12 pointer-events-none">
        {/* Top-left */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-black rounded-tl-lg" />
        {/* Top-right */}
        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-black rounded-tr-lg" />
        {/* Bottom-left */}
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-black rounded-bl-lg" />
        {/* Bottom-right */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-black rounded-br-lg" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Animated spy GIF - smaller */}
        <div className="relative">
          <img
            src={loadingSpy}
            alt="Loading"
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl"
            style={{
              filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.3))",
              border: "3px solid black",
            }}
          />
        </div>

        {/* Progress bar */}
        <div className="w-32 md:w-40 h-2 bg-black/20 rounded-full overflow-hidden border-2 border-black">
          <div
            className="h-full bg-black rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading indicator - cartoon style */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border-2 border-black"
                style={{
                    backgroundColor: "#1a1a1a",
                    animation: "cartoonBounce 0.8s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p
            className="text-sm font-black tracking-wider uppercase"
            style={{
              color: "#1a1a1a",
              textShadow: "2px 2px 0px rgba(255,255,255,0.3)",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {imagesLoaded ? "READY!" : `${progress}%`}
          </p>
        </div>
      </div>

      {/* Fade out overlay */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          imagesLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundColor: "#f5a442",
          transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

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
