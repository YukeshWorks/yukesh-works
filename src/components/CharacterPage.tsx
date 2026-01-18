import { useState, useEffect } from "react";
import profileImage from "@/assets/profile.jpg";

const CharacterPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden page-transition">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-transparent" />
      <div className="absolute top-0 right-0 w-3/5 h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-background" />
      </div>
      
      {/* Subtle film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Profile image on right side - STATIC, subtle desaturation */}
      <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-3/5 overflow-hidden">
        <img 
          src={profileImage} 
          alt="Yukesh Kumar" 
          className="h-full w-full object-cover object-[65%_top] md:object-[center_top] opacity-80"
          style={{ filter: 'saturate(0.85) contrast(1.05)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 md:hidden bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-md">
          {/* Main title - centered, clean */}
          <div className="character-name-reveal text-center md:text-left">
            <h1 className="font-display text-3xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider">
              <span className="text-primary glow-text">Yukesh</span>
              <br />
              <span className="text-foreground">Kumar</span>
            </h1>
          </div>
        </div>
      </div>
      
      {/* Time/Date display - absolute bottom of page */}
      <div className="absolute bottom-4 right-4 z-20 character-time-reveal">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-mono">
          <span className="time-pulse">{formatTime(currentTime)}</span>
          <span className="opacity-40">|</span>
          <span>{formatDate(currentTime)}</span>
        </div>
      </div>
    </section>
  );
};

export default CharacterPage;
