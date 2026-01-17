import { useState, useEffect } from "react";
import homeBg from "@/assets/home-bg.jpg";

const HomePage = () => {
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
      {/* Full background image - NO SCALE ANIMATION, static 1x */}
      <div className="absolute inset-0">
        <img 
          src={homeBg} 
          alt="Background" 
          className="h-full w-full object-cover object-center opacity-90"
          style={{ transform: 'scale(1)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Animated smoke effect */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 smoke-particle" />
        <div className="absolute top-1/3 right-1/3 w-24 h-24 smoke-particle delay-200" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="max-w-xl fade-in-up opacity-0 delay-200">
          {/* Main title with typewriter effect */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-4 uppercase tracking-wider">
            <span className="text-foreground/90">Yukesh</span>
            <br />
            <span className="gradient-text">Kumar</span>
          </h1>
          
          <p className="text-muted-foreground text-sm md:text-base mt-6 max-w-md leading-relaxed">
            Lost in thoughts, found in creativity.
          </p>
        </div>
        
        {/* Time/Date display - bottom right with smooth animation */}
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

export default HomePage;
