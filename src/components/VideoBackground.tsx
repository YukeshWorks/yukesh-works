import { useRef, useEffect, useState } from "react";
import ambientVideo from "@/assets/ambient-bg.mp4";

interface VideoBackgroundProps {
  beatIntensity?: number;
}

const VideoBackground = ({ beatIntensity = 0 }: VideoBackgroundProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video loops and plays
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.log('Video autoplay prevented, waiting for user interaction');
      }
    };

    video.addEventListener('loadeddata', () => {
      setIsLoaded(true);
      playVideo();
    });

    playVideo();

    return () => {
      video.pause();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video background - simplified, no beat transforms */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.7)' }}
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={ambientVideo} type="video/mp4" />
      </video>

      {/* Static overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
      
      {/* Subtle beat pulse - opacity only */}
      {beatIntensity > 0 && (
        <div 
          className="absolute inset-0 bg-primary/5 pointer-events-none"
          style={{ opacity: beatIntensity * 0.3, transition: 'opacity 0.1s ease-out' }}
        />
      )}

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.7) 100%)' }} 
      />

      {/* Loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
