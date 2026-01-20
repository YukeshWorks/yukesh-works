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

  // Beat-synced scale effect
  const beatScale = 1 + beatIntensity * 0.03;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-150 will-change-transform"
        style={{
          transform: `scale(${beatScale})`,
          filter: `brightness(${0.6 + beatIntensity * 0.15})`,
        }}
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={ambientVideo} type="video/mp4" />
      </video>

      {/* Overlay gradients for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
      
      {/* Beat pulse overlay */}
      <div 
        className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-150"
        style={{ opacity: beatIntensity * 0.5 }}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" 
           style={{ 
             background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.7) 100%)' 
           }} 
      />

      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
