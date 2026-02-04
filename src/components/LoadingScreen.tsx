import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";
import profileImg from "@/assets/profile.jpg";
import loadingSpy from "@/assets/loading-spy.gif";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload all heavy images with 2 second minimum display
  useEffect(() => {
    const images = [homeBg, profileImg];
    let loaded = 0;
    const startTime = Date.now();

    const preloadImage = (src: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loaded++;
          resolve();
        };
        img.onerror = () => {
          loaded++;
          resolve();
        };
      });
    };

    Promise.all(images.map(preloadImage)).then(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed); // Ensure 2 seconds minimum
      
      setTimeout(() => {
        setImagesLoaded(true);
        setTimeout(onLoadComplete, 300);
      }, remaining);
    });
  }, [onLoadComplete]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: '#f5a442' }}
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
              filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.3))',
              border: '3px solid black',
            }}
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
                  backgroundColor: '#1a1a1a',
                  animation: 'cartoonBounce 0.8s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p 
            className="text-sm font-black tracking-wider uppercase"
            style={{ 
              color: '#1a1a1a',
              textShadow: '2px 2px 0px rgba(255,255,255,0.3)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {imagesLoaded ? "READY!" : "LOADING..."}
          </p>
        </div>
      </div>
      
      {/* Fade out overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          imagesLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: '#f5a442' }}
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
