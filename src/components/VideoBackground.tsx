import { useState, useRef } from "react";
import desktopBgVideo from "@/assets/desktop-bg-video.mp4";
import mobileBgVideo from "@/assets/mobile-bg-video.mp4";

interface VideoBackgroundProps {
  beatIntensity?: number;
  onLoaded?: () => void;
}

const VideoBackground = ({ beatIntensity = 0, onLoaded }: VideoBackgroundProps) => {
  const [isMobile] = useState(() => window.innerWidth < 768);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleReady = () => {
    setReady(true);
    onLoaded?.();
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {isMobile ? (
        <video
          ref={videoRef}
          src={mobileBgVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'brightness(0.65)',
            transform: 'translateZ(0)',
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
          }}
          onCanPlay={handleReady}
        />
      ) : (
        <>
          {/* Blurred fill behind to cover gaps */}
          <video
            src={desktopBgVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'brightness(0.4) blur(30px)',
              transform: 'scale(1.1) translateZ(0)',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.8s ease-out',
            }}
          />
          {/* Sharp centered video */}
          <video
            src={desktopBgVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full object-contain mx-auto"
            style={{
              filter: 'brightness(0.65)',
              transform: 'translateZ(0)',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.8s ease-out',
              left: '50%',
              transform: 'translateX(-50%) translateZ(0)',
            }}
            onCanPlay={handleReady}
          />
        </>
      )}

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
