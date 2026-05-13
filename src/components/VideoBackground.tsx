import { useState, useRef } from "react";
import desktopBgVideo from "@/assets/desktop-bg-video.mp4";
import mobileBgVideo from "@/assets/mobile-bg-video.mp4";
import desktopBgVideoHi from "@/assets/desktop-bg-video-hi.mp4";
import mobileBgVideoHi from "@/assets/mobile-bg-video-hi.mp4";
import homeBg from "@/assets/home-bg.jpg";
import mobileBg from "@/assets/mobile-bg.jpg";
import { useNetworkSpeed } from "@/hooks/useNetworkSpeed";

interface VideoBackgroundProps {
  beatIntensity?: number;
  onLoaded?: () => void;
}

const VideoBackground = ({ beatIntensity = 0, onLoaded }: VideoBackgroundProps) => {
  const [isMobile] = useState(() => window.innerWidth < 768);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isSlow, isFast } = useNetworkSpeed();

  const poster = isMobile ? mobileBg : homeBg;
  // On fast networks, swap to higher-bitrate hi-res video
  const mobileSrc = isFast ? mobileBgVideoHi : mobileBgVideo;
  const desktopSrc = isFast ? desktopBgVideoHi : desktopBgVideo;

  const handleReady = () => {
    setReady(true);
    onLoaded?.();
  };

  // On very slow networks: show poster image only — no video download
  if (isSlow) {
    // Trigger ready immediately so content fades in
    if (!ready) {
      requestAnimationFrame(handleReady);
    }
    return (
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.65)', transform: 'translateZ(0)' }}
        />
        <div className="absolute inset-0" style={{
          background: isMobile
            ? 'linear-gradient(to bottom, hsl(var(--background) / 0.6), hsl(var(--background) / 0.4), hsl(var(--background) / 0.7))'
            : 'linear-gradient(to right, hsl(var(--background) / 0.85), hsl(var(--background) / 0.5), transparent)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.5) 100%)',
        }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {isMobile ? (
        <video
          ref={videoRef}
          src={mobileSrc}
          poster={poster}
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
        <video
          ref={videoRef}
          src={desktopSrc}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          className="absolute"
          style={{
            filter: 'brightness(0.65)',
            transform: 'rotate(-90deg) translateZ(0)',
            transformOrigin: 'center center',
            width: '100vh',
            height: '100vw',
            top: '50%',
            left: '50%',
            marginTop: 'calc(-50vw)',
            marginLeft: 'calc(-50vh)',
            objectFit: 'cover',
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
          }}
          onCanPlay={handleReady}
        />
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
