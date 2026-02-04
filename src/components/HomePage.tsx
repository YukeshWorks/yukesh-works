import { useState, useEffect, useCallback } from "react";
import { Github, Linkedin, Instagram, Mail, Sparkles, Triangle, Circle } from "lucide-react";
import offlineCloud from "@/assets/offline-cloud.gif";
import PortfolioModal from "./PortfolioModal";
import ContactModal from "./ContactModal";
import VideoBackground from "./VideoBackground";
import AudioController from "./AudioController";

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle beat from audio controller
  const handleBeat = useCallback((intensity: number) => {
    setBeatIntensity(intensity);
    // Reset intensity after animation
    setTimeout(() => setBeatIntensity(0), 150);
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
      {/* Cinematic video background */}
      <VideoBackground beatIntensity={beatIntensity} />
      
      {/* Audio controller with beat detection */}
      <AudioController onBeat={handleBeat} />
      
      {/* Simplified floating icons - fewer, CSS-only animations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] animate-float-slow">
          <Sparkles className="w-4 h-4 text-primary/15" />
        </div>
        <div className="absolute top-[60%] right-[12%] animate-float-slow" style={{ animationDelay: '2s' }}>
          <Circle className="w-3 h-3 text-primary/10" />
        </div>
        <div className="absolute top-[75%] left-[8%] animate-float-slow" style={{ animationDelay: '4s' }}>
          <Triangle className="w-3 h-3 text-primary/10" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10 pt-16">
        <div className="max-w-lg fade-in-up opacity-0 delay-200">
          {/* Status badge with offline cloud GIF */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-2xl glass text-[10px] font-black tracking-wide uppercase border-2 border-foreground/20">
            {!isOnline ? (
              <>
                <img src={offlineCloud} alt="Offline" className="w-5 h-5" />
                <span className="text-muted-foreground">Offline</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400">Online</span>
              </>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight cartoon-text">
            <span className="text-foreground/90 font-medium" style={{ textShadow: '2px 2px 0px hsl(var(--primary) / 0.3)' }}>Hi, I'm</span>
            <br />
            <span className="gradient-text breathing-glow font-black" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>Yukesh Kumar</span>
          </h1>
          
          <p className="text-muted-foreground text-sm md:text-base mt-4 max-w-sm leading-relaxed font-medium" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
            Lost in thoughts, found in creativity.
          </p>
          
          {/* CTA buttons - cartoon style */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button 
              onClick={() => setIsPortfolioOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform duration-200 border-3 border-black"
              style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.3)' }}
            >
              View Work
            </button>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="px-5 py-2.5 rounded-2xl glass text-xs font-black uppercase tracking-wide hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-foreground/30"
              style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.1)' }}
            >
              Contact Me
            </button>
          </div>
          
          {/* Social icons - cartoon style */}
          <div className="flex items-center gap-3 mt-8 text-muted-foreground">
            <span className="text-[10px] font-black tracking-wider uppercase opacity-70">Connect</span>
            <div className="w-8 h-0.5 bg-foreground/30 rounded-full" />
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:mailtoyukesh33@gmail.com" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20">
                <Mail className="w-4 h-4" />
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

      {/* Modals */}
      <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </section>
  );
};

export default HomePage;
