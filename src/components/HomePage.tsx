import { useState, useEffect } from "react";
import { Github, Linkedin, Instagram, Mail, Sparkles, Zap, Triangle, Circle, Square } from "lucide-react";
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
      {/* Full background image with breathing effect */}
      <div className="absolute inset-0 home-bg-breathe">
        <img 
          src={homeBg} 
          alt="Background" 
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />
      </div>
      
      {/* Floating decorative icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] floating-icon-1">
          <Sparkles className="w-4 h-4 text-primary/20" />
        </div>
        <div className="absolute top-[25%] right-[15%] floating-icon-2">
          <Triangle className="w-3 h-3 text-primary/15 fill-primary/10" />
        </div>
        <div className="absolute top-[60%] left-[5%] floating-icon-3">
          <Circle className="w-5 h-5 text-primary/10" />
        </div>
        <div className="absolute top-[45%] right-[8%] floating-icon-4">
          <Square className="w-3 h-3 text-primary/15 rotate-45" />
        </div>
        <div className="absolute top-[75%] right-[25%] floating-icon-5">
          <Zap className="w-4 h-4 text-primary/15" />
        </div>
        <div className="absolute top-[10%] right-[40%] floating-icon-6">
          <Circle className="w-2 h-2 text-primary/20 fill-primary/20" />
        </div>
        
        {/* Ambient particles */}
        <div className="ambient-particle particle-1" />
        <div className="ambient-particle particle-2" />
        <div className="ambient-particle particle-3" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 pt-16">
        <div className="max-w-lg fade-in-up opacity-0 delay-200">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full glass text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Available for projects
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-tight">
            <span className="text-foreground/90 font-light">Hi, I'm</span>
            <br />
            <span className="gradient-text breathing-glow font-bold">Yukesh Kumar</span>
          </h1>
          
          <p className="text-muted-foreground text-xs md:text-sm mt-4 max-w-sm leading-relaxed font-light">
            Lost in thoughts, found in creativity.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-wrap gap-2.5 mt-6">
            <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:scale-105 transition-transform duration-200 glow-border">
              View Work
            </button>
            <button className="px-4 py-2 rounded-full glass text-xs font-medium hover:bg-primary/10 transition-all duration-200">
              Contact Me
            </button>
          </div>
          
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-8 text-muted-foreground">
            <span className="text-[9px] font-medium tracking-wider uppercase opacity-60">Connect</span>
            <div className="w-8 h-px bg-border" />
            <div className="flex gap-2">
              <a href="#" className="w-7 h-7 rounded-full glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200">
                <Github className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200">
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time/Date display - BOTTOM of page */}
      <div className="absolute bottom-3 right-3 z-20 fade-in-up opacity-0 delay-500">
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 font-mono">
          <span className="time-pulse">{formatTime(currentTime)}</span>
          <span className="opacity-30">•</span>
          <span>{formatDate(currentTime)}</span>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
