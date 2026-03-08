import { useState, useEffect } from "react";
import desktopBg from "@/assets/home-bg.jpg";
import mobileBg from "@/assets/mobile-bg.jpg";

interface VideoBackgroundProps {
  beatIntensity?: number;
  onLoaded?: () => void;
}

const VideoBackground = ({ beatIntensity = 0, onLoaded }: VideoBackgroundProps) => {
  const [isMobile] = useState(() => window.innerWidth < 768);
  const [imgReady, setImgReady] = useState(false);

  const handleImgLoad = () => {
    setImgReady(true);
    onLoaded?.();
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={isMobile ? mobileBg : desktopBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: 'brightness(0.65)',
          transform: 'translateZ(0)',
          opacity: imgReady ? 1 : 0,
          transition: 'opacity 0.8s ease-out',
        }}
        loading="eager"
        onLoad={handleImgLoad}
      />

      <div className="absolute inset-0" style={{
        background: isMobile
          ? 'linear-gradient(to bottom, hsl(var(--background) / 0.6), hsl(var(--background) / 0.4), hsl(var(--background) / 0.7))'
          : 'linear-gradient(to right, hsl(var(--background) / 0.85), hsl(var(--background) / 0.5), transparent)',
        transform: 'translateZ(0)',
      }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, hsl(var(--background) / 0.6), transparent 50%, hsl(var(--background) / 0.2))',
        transform: 'translateZ(0)',
      }} />

      {beatIntensity > 0 && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none"
          style={{ opacity: beatIntensity * 0.3, transition: 'opacity 0.1s ease-out', transform: 'translateZ(0)' }} />
      )}

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.5) 100%)',
        transform: 'translateZ(0)',
      }} />
    </div>
  );
};

export default VideoBackground;
