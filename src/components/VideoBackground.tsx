import { useRef, useEffect, useState } from "react";
import ambientVideo from "@/assets/ambient-bg.mp4";
import mobileBg from "@/assets/mobile-bg.jpg";

interface VideoBackgroundProps {
  beatIntensity?: number;
}

const VideoBackground = ({ beatIntensity = 0 }: VideoBackgroundProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsLoaded(true);
      return;
    }
    
    const video = videoRef.current;
    if (!video) return;

    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.log('Video autoplay prevented');
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
  }, [isMobile]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Mobile: Static anime image background */}
      {isMobile ? (
        <img
          src={mobileBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.6)' }}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        /* Desktop: Video background */
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
      )}

      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
      
      {/* Beat pulse */}
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
