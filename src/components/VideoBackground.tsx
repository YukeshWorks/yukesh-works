import { useState, useEffect } from "react";
import desktopBg from "@/assets/home-bg.jpg";
import mobileBg from "@/assets/mobile-bg.jpg";

interface VideoBackgroundProps {
  beatIntensity?: number;
}

const VideoBackground = ({ beatIntensity = 0 }: VideoBackgroundProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background image - different for mobile/desktop */}
      <img
        src={isMobile ? mobileBg : desktopBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ 
          filter: 'brightness(0.65)',
          transform: 'translateZ(0)', // GPU acceleration
        }}
        onLoad={() => setIsLoaded(true)}
      />

      {/* Overlay gradients - responsive */}
      <div 
        className="absolute inset-0"
        style={{
          background: isMobile 
            ? 'linear-gradient(to bottom, hsl(var(--background) / 0.7), hsl(var(--background) / 0.5), hsl(var(--background) / 0.8))'
            : 'linear-gradient(to right, hsl(var(--background) / 0.85), hsl(var(--background) / 0.5), transparent)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background) / 0.7), transparent 50%, hsl(var(--background) / 0.3))'
        }}
      />
      
      {/* Beat pulse - GPU optimized */}
      {beatIntensity > 0 && (
        <div 
          className="absolute inset-0 bg-primary/5 pointer-events-none will-change-opacity"
          style={{ 
            opacity: beatIntensity * 0.3, 
            transition: 'opacity 0.1s ease-out',
            transform: 'translateZ(0)',
          }}
        />
      )}

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.6) 100%)',
          transform: 'translateZ(0)',
        }} 
      />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
