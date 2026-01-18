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
      {/* Full background image - STATIC */}
      <div className="absolute inset-0">
        <img 
          src={homeBg} 
          alt="Background" 
          className="h-full w-full object-cover object-center"
          style={{ opacity: 0.9 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="max-w-xl fade-in-up opacity-0 delay-200">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-4 uppercase tracking-wider">
            <span className="text-foreground/90">Yukesh</span>
            <br />
            <span className="gradient-text">Kumar</span>
          </h1>
          
          <p className="text-muted-foreground text-sm md:text-base mt-6 max-w-md leading-relaxed">
            Lost in thoughts, found in creativity.
          </p>
        </div>
      </div>
      
      {/* Time/Date display - BOTTOM of page */}
      <div className="absolute bottom-4 right-4 z-20 fade-in-up opacity-0 delay-500">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
          <span className="time-pulse">{formatTime(currentTime)}</span>
          <span className="opacity-40">|</span>
          <span>{formatDate(currentTime)}</span>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
