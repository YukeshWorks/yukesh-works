import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";
import profileImg from "@/assets/profile.jpg";

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
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
          setProgress((loaded / images.length) * 100);
          resolve();
        };
        img.onerror = () => {
          loaded++;
          setProgress((loaded / images.length) * 100);
          resolve();
        };
      });
    };

    Promise.all(images.map(preloadImage)).then(() => {
      setImagesLoaded(true);
      // Small delay for smooth transition
      setTimeout(onLoadComplete, 500);
    });
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              left: `${20 + i * 15}%`,
              animation: `floatParticle ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo / Symbol */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-card border border-primary/20 flex items-center justify-center overflow-hidden">
            <span className="font-display text-3xl font-bold gradient-text">42</span>
          </div>
          
          {/* Orbiting ring */}
          <div 
            className="absolute inset-0 rounded-2xl border border-primary/30"
            style={{
              animation: 'pulseRing 2s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Animated loader - cute dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              style={{
                animation: 'loaderBounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        
        {/* Loading text */}
        <p className="text-muted-foreground text-sm font-mono tracking-wider">
          {imagesLoaded ? "Ready" : "Loading"}
        </p>
      </div>
      
      {/* Fade out overlay - this fades the loading screen out */}
      <div 
        className={`absolute inset-0 bg-background transition-opacity duration-500 pointer-events-none ${
          imagesLoaded ? 'opacity-0' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default LoadingScreen;
