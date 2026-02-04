import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";
import profileImg from "@/assets/profile.jpg";
import loadingCar from "@/assets/loading-car.gif";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload all heavy images
  useEffect(() => {
    const images = [homeBg, profileImg];
    let loaded = 0;

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
      setImagesLoaded(true);
      setTimeout(onLoadComplete, 800);
    });
  }, [onLoadComplete]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: '#c4c4c4' }}
    >
      {/* VHS scanlines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />
      
      {/* Corner brackets frame */}
      <div className="absolute inset-8 md:inset-16 pointer-events-none">
        {/* Top-left */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-gray-600/50" />
        {/* Top-right */}
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-gray-600/50" />
        {/* Bottom-left */}
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-gray-600/50" />
        {/* Bottom-right */}
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-gray-600/50" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated car GIF */}
        <div className="relative">
          <img 
            src={loadingCar} 
            alt="Loading" 
            className="w-48 h-auto md:w-64"
            style={{ 
              filter: 'drop-shadow(0 4px 20px rgba(255, 80, 100, 0.3))',
            }}
          />
        </div>
        
        {/* Loading indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#ff4d6a',
                  animation: 'loaderPulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <p 
            className="text-sm font-mono tracking-wider"
            style={{ color: '#555' }}
          >
            {imagesLoaded ? "READY" : "LOADING"}
          </p>
        </div>
      </div>
      
      {/* Fade out overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          imagesLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: '#c4c4c4' }}
      />

      <style>{`
        @keyframes loaderPulse {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
