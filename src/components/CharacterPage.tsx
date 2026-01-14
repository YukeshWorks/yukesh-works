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
      hour: "2-digit",
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
    <section className="min-h-screen flex items-center relative overflow-hidden page-transition">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-transparent" />
      <div className="absolute top-0 right-0 w-3/5 h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-background" />
      </div>
      
      {/* Profile image on right side with always-running animation */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-3/5 overflow-hidden">
        <img 
          src={profileImage} 
          alt="Yukesh Kumar" 
          className="h-full w-full object-cover object-center opacity-80 breathing-animation"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="max-w-xl">
          {/* Main title */}
          <div className="fade-in-up opacity-0 delay-200">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 uppercase tracking-wider">
              <span className="text-primary">Yukesh</span>
              <br />
              <span className="text-foreground">Kumar</span>
            </h1>
          </div>
        </div>
        
        {/* Time/Date display - bottom right */}
        <div className="absolute bottom-8 right-8 fade-in-up opacity-0 delay-500">
          <div className="flex items-center gap-3 text-xs text-muted-foreground/80">
            <span className="time-animation font-mono">{formatTime(currentTime)}</span>
            <span className="date-animation font-mono">{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CharacterPage;
