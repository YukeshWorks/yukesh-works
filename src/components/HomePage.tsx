import { useState, useEffect, useCallback } from "react";
import { Github, Linkedin, Instagram, Mail, Search, Heart, ChevronRight, Plus } from "lucide-react";
import PortfolioModal from "./PortfolioModal";
import ContactModal from "./ContactModal";
import AudioController from "./AudioController";
import AmbientLightController from "./AmbientLightController";
import profileImg from "@/assets/profile.jpg";

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [beatIntensity, setBeatIntensity] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBeat = useCallback((intensity: number) => {
    setBeatIntensity(intensity);
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
      year: "numeric",
    });
  };

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden bg-black">
      <AmbientLightController>
        {/* Audio controller */}
        <AudioController onBeat={handleBeat} />
        
        {/* Large background typography */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <h1 
            className="text-[20vw] md:text-[18vw] font-black tracking-tighter text-transparent opacity-[0.08] leading-none uppercase"
            style={{
              WebkitTextStroke: '2px hsl(0 0% 30%)',
              transform: `scale(${1 + beatIntensity * 0.02})`,
              transition: 'transform 150ms ease-out',
            }}
          >
            YUKESH
          </h1>
        </div>
        
        {/* Secondary background text layer */}
        <div className="absolute top-[15%] left-[5%] pointer-events-none select-none">
          <span 
            className="font-script text-4xl md:text-6xl text-white/5 italic"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Yukesh
          </span>
        </div>
        
        {/* Profile image - centered with dramatic lighting */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative z-20"
            style={{
              transform: `scale(${1 + beatIntensity * 0.01})`,
              transition: 'transform 150ms ease-out',
            }}
          >
            <img
              src={profileImg}
              alt="Yukesh Kumar"
              className="w-[50vw] md:w-[35vw] lg:w-[28vw] max-w-md h-auto object-cover"
              style={{
                filter: 'contrast(1.1) saturate(0.9)',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 95%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 95%)',
              }}
            />
            
            {/* Red accent glow behind image */}
            <div className="absolute inset-0 -z-10 blur-3xl opacity-60">
              <div className="absolute top-1/4 right-0 w-3/4 h-3/4 bg-red-600/30 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Left side content */}
        <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 z-30 max-w-xs">
          {/* Title tag */}
          <div className="mb-4 fade-in-up opacity-0 delay-100">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">
              THE CREATOR
            </span>
          </div>
          
          {/* Name badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 fade-in-up opacity-0 delay-200">
            <span className="text-xs font-medium text-white/80">Yukesh</span>
            <ChevronRight className="w-3 h-3 text-white/40" />
          </div>
          
          {/* Design by text */}
          <div className="fade-in-up opacity-0 delay-300">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Design by</p>
            <p className="text-sm font-semibold text-white/70">Yukesh</p>
          </div>
        </div>
        
        {/* Right side content */}
        <div className="absolute right-6 md:right-12 bottom-[20%] z-30 max-w-xs text-right fade-in-up opacity-0 delay-400">
          <h3 className="text-lg md:text-xl font-bold text-white/90 mb-2">
            More than that
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            creating digital experiences<br />
            and making them alive
          </p>
        </div>
        
        {/* About section - floating card */}
        <div className="absolute left-6 md:left-12 bottom-[15%] z-30 max-w-[280px] fade-in-up opacity-0 delay-500">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            {/* Search-like header */}
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
              <span className="text-sm font-medium text-white/80">About me</span>
              <span className="text-white/20">_|</span>
              <Search className="w-4 h-4 text-white/40 ml-auto" />
            </div>
            
            <p className="text-[11px] text-white/50 leading-relaxed">
              A passionate creator from the digital realm. 
              Specializing in web development, UI/UX design, 
              and bringing creative visions to life through code.
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <ChevronRight className="w-4 h-4 text-white/60 bg-white/10 rounded p-0.5" />
            </div>
          </div>
        </div>
        
        {/* Status badge - OFFLINE */}
        <div className="absolute top-24 left-6 md:left-12 z-30 fade-in-up opacity-0 delay-200">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/30 border border-red-500/20 text-[10px] font-medium tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400">Offline</span>
          </div>
        </div>
        
        {/* CTA Buttons - top right */}
        <div className="absolute top-24 right-6 md:right-12 z-30 flex gap-2 fade-in-up opacity-0 delay-300">
          <button 
            onClick={() => setIsPortfolioOpen(true)}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-sm"
          >
            View Work
          </button>
          <button 
            onClick={() => setIsContactOpen(true)}
            className="px-4 py-2 rounded-full bg-red-600/80 text-white text-xs font-medium hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Contact Me
          </button>
        </div>
        
        {/* UI Elements - decorative controls */}
        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-3 fade-in-up opacity-0 delay-600">
          {/* Slider control */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 w-36">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-white/40">
              <span>Saturation</span>
              <span>52%</span>
            </div>
          </div>
          
          {/* Heart button */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center hover:scale-110 transition-transform">
              <Heart className="w-4 h-4 text-white fill-white" />
            </button>
          </div>
          
          {/* Image gallery preview */}
          <div className="flex gap-1.5">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>
        
        {/* Social icons - bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 fade-in-up opacity-0 delay-700">
          <div className="flex gap-2">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-200 backdrop-blur-sm">
              <Github className="w-4 h-4 text-white/60" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-200 backdrop-blur-sm">
              <Linkedin className="w-4 h-4 text-white/60" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-200 backdrop-blur-sm">
              <Instagram className="w-4 h-4 text-white/60" />
            </a>
            <a href="mailto:mailtoyukesh33@gmail.com" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-200 backdrop-blur-sm">
              <Mail className="w-4 h-4 text-white/60" />
            </a>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="absolute bottom-6 left-6 md:left-12 z-30 fade-in-up opacity-0 delay-800">
          <div className="flex gap-8 text-[9px] text-white/30">
            <div>
              <p className="mb-1">Portfolio</p>
              <p className="text-white/50">Yukesh Kumar</p>
            </div>
            <div>
              <p className="mb-1">Visual</p>
              <p className="text-white/50">Communication Design</p>
            </div>
          </div>
        </div>
        
        {/* Time/Date display */}
        <div className="absolute bottom-6 right-6 md:right-12 z-30 fade-in-up opacity-0 delay-800">
          <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-mono">
            <span className="time-pulse">{formatTime(currentTime)}</span>
            <span className="opacity-30">•</span>
            <span>{formatDate(currentTime)}</span>
          </div>
        </div>

        {/* Modals */}
        <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
        <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      </AmbientLightController>
    </section>
  );
};

export default HomePage;
