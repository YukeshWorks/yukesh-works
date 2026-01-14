import { useState, useEffect } from "react";
import profileImage from "@/assets/profile.jpg";
import { Instagram, Twitter, Facebook } from "lucide-react";

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
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-transparent" />
      <div className="absolute top-0 right-0 w-3/5 h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-background" />
      </div>
      
      {/* Profile image on right side */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-3/5 overflow-hidden">
        <img 
          src={profileImage} 
          alt="Yukesh Kumar" 
          className="h-full w-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="max-w-xl">
          {/* Main title */}
          <div className="fade-in-up opacity-0 delay-200">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase tracking-wider">
              <span className="text-primary">Yukesh</span>
              <br />
              <span className="text-foreground">Kumar</span>
            </h1>
          </div>
          
          {/* Decorative character icon */}
          <div className="fade-in-up opacity-0 delay-300 my-8">
            <div className="w-16 h-16 rounded-lg bg-card/50 border border-primary/30 flex items-center justify-center">
              <span className="text-2xl font-display font-bold gradient-text">YK</span>
            </div>
          </div>
          
          {/* Social icons */}
          <div className="fade-in-up opacity-0 delay-400 flex gap-4 mt-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook size={20} />
            </a>
          </div>
        </div>
        
        {/* Time/Date display - bottom right */}
        <div className="absolute bottom-8 right-8 fade-in-up opacity-0 delay-500">
          <div className="glass rounded-lg px-4 py-3 text-right">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="time-animation">{formatTime(currentTime)}</span>
              <span className="text-primary/50">|</span>
              <span className="date-animation">{formatDate(currentTime)}</span>
            </div>
          </div>
        </div>
        
        {/* Page navigation dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 fade-in-up opacity-0 delay-500">
          <span className="text-primary text-lg font-bold">←</span>
          <span className="text-primary text-2xl font-bold">01</span>
          <span className="text-muted-foreground text-sm">02</span>
          <span className="text-muted-foreground text-sm">03</span>
          <span className="text-muted-foreground text-sm">04</span>
          <span className="text-muted-foreground text-lg font-bold">→</span>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
