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
      {/* Full-bleed profile image background */}
      <div className="absolute inset-0">
        <img 
          src={profileImage} 
          alt="Yukesh Kumar" 
          className="h-full w-full object-cover object-[70%_top] md:object-[center_top]"
          style={{ filter: 'saturate(0.9) contrast(1.05) brightness(0.85)' }}
        />
        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />
      </div>
      
      {/* Name positioned at bottom-left with breathing glow */}
      <div className="absolute bottom-16 md:bottom-20 left-4 md:left-12 z-10">
        <div className="character-name-reveal">
          <h1 className="font-display text-4xl md:text-6xl lg:text-8xl font-bold uppercase tracking-wider">
            <span className="text-primary glow-text breathing-glow">Yukesh</span>
            <br />
            <span className="text-foreground/90">Kumar</span>
          </h1>
        </div>
      </div>
      
      {/* Time/Date display - bottom right */}
      <div className="absolute bottom-4 right-4 z-20 character-time-reveal">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
          <span className="time-pulse">{formatTime(currentTime)}</span>
          <span className="opacity-40">|</span>
          <span>{formatDate(currentTime)}</span>
        </div>
      </div>
    </section>
  );
};

export default CharacterPage;
