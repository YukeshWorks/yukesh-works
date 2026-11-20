import { useState, useEffect, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Linkedin, Instagram, Mail, MessageCircle, Sparkles, Triangle, Circle } from "lucide-react";
import offlineCloud from "@/assets/offline-cloud.gif";
import PortfolioModal from "./PortfolioModal";
import ContactModal from "./ContactModal";
import VideoBackground from "./VideoBackground";
import AudioController from "./AudioController";
import { Magnetic, PointerTilt, ScrambleText } from "./HeroFx";

const formatTime = (date: Date) => date.toLocaleTimeString("en-US", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
});

const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
  month: "short", day: "2-digit",
});

// Isolated so the per-second tick only re-renders the clock, not the whole hero.
const Clock = memo(() => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;
    const tick = () => {
      setNow(new Date());
      // Align to the next whole second so digits flip on time without drift.
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="absolute bottom-5 right-5 z-20">
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-baseline gap-1 font-mono tabular-nums">
          {formatTime(now).split("").map((char, i) => (
            <span key={`${i}-${char}`} className="inline-block text-base md:text-lg text-foreground/60 tracking-[0.15em]" style={{ animation: char !== ":" && char !== " " ? "digitFlip 0.45s cubic-bezier(0.16, 1, 0.3, 1)" : "none" }}>{char}</span>
          ))}
        </div>
        <span className="text-[10px] font-heading tracking-[0.3em] uppercase text-muted-foreground/30">{formatDate(now)}</span>
      </div>
      <style>{`
        @keyframes digitFlip {
          0% { transform: translateY(-40%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
Clock.displayName = "Clock";

const HomePage = () => {
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [contentVisible, setContentVisible] = useState(false);

  const handleBgLoaded = useCallback(() => {
    requestAnimationFrame(() => setContentVisible(true));
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleBeat = useCallback((intensity: number) => {
    setBeatIntensity(intensity);
    window.setTimeout(() => setBeatIntensity(0), 150);
  }, []);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden page-transition">
      <VideoBackground beatIntensity={beatIntensity} onLoaded={handleBgLoaded} />
      <AudioController onBeat={handleBeat} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] animate-float-slow"><Sparkles className="w-4 h-4 text-primary/15" /></div>
        <div className="absolute top-[60%] right-[12%] animate-float-slow" style={{ animationDelay: "2s" }}><Circle className="w-3 h-3 text-primary/10" /></div>
        <div className="absolute top-[75%] left-[8%] animate-float-slow" style={{ animationDelay: "4s" }}><Triangle className="w-3 h-3 text-primary/10" /></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-16">
        <PointerTilt className="max-w-lg">
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-2xl glass text-[10px] font-heading tracking-[0.2em] uppercase border-2 border-foreground/20 transition-all duration-500 ease-out"
            style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : "translateX(-30px)", transitionDelay: "200ms" }}
          >
            {!isOnline ? (
              <><img src={offlineCloud} alt="Offline" className="w-5 h-5" /><span className="text-muted-foreground">Offline</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-green-400">Online</span></>
            )}
          </div>

          <h1
            className="text-3xl md:text-5xl lg:text-6xl mb-3 tracking-tight transition-all duration-600 ease-out"
            style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "350ms" }}
          >
            <span className="text-foreground/90 font-heading text-2xl md:text-3xl lg:text-4xl tracking-[0.15em] uppercase" style={{ textShadow: "2px 2px 0px hsl(var(--primary) / 0.3)" }}>Hi, I'm</span>
            <br />
            <span className="gradient-text breathing-glow font-display" style={{ textShadow: "4px 4px 0px rgba(0,0,0,0.3)", fontSize: "110%" }}><ScrambleText text="Yukesh Kumar" play={contentVisible} /></span>
          </h1>

          <p
            className="text-muted-foreground text-base md:text-lg mt-4 max-w-sm leading-relaxed font-medium transition-all duration-500 ease-out font-mono"
            style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)", opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : "translateX(-20px)", transitionDelay: "500ms", letterSpacing: "0.05em" }}
          >
            Lost in thoughts, found in creativity.
          </p>

          <div
            className="flex flex-wrap items-start gap-3 mt-6 transition-all duration-500 ease-out"
            style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : "translateX(30px)", transitionDelay: "650ms" }}
          >
            <Magnetic>
            <button
              type="button"
              onClick={() => setIsPortfolioOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-heading uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform duration-200 border-3 border-black"
              style={{ boxShadow: "3px 3px 0px rgba(0,0,0,0.3)" }}
            >
              View Work
            </button>
            </Magnetic>
            <Magnetic>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="px-5 py-2.5 rounded-2xl glass text-xs font-heading uppercase tracking-[0.2em] hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-foreground/30"
              style={{ boxShadow: "3px 3px 0px rgba(0,0,0,0.1)" }}
            >
              Contact
            </button>
            </Magnetic>
            <Magnetic>
            <a
              href="https://t.me/Yukesh_tg"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-2xl glass text-xs font-heading uppercase tracking-[0.2em] hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-foreground/30 inline-flex items-center justify-center"
            >
              Telegram
            </a>
            </Magnetic>
            <div className="services-cta-wrap">
              <span className="services-cta-bubble" aria-hidden="true">NEW · Tap to explore</span>
              <Link to="/services" className="services-cta-link px-5 py-2.5 rounded-2xl glass text-xs font-heading uppercase tracking-[0.2em] text-primary border-2 border-primary/70 inline-flex items-center justify-center">Digital Services</Link>
            </div>
          </div>

          <div
            className="flex items-center gap-3 mt-8 text-muted-foreground transition-all duration-500 ease-out"
            style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : "translateX(-25px)", transitionDelay: "800ms" }}
          >
            <span className="text-[10px] font-heading tracking-[0.3em] uppercase opacity-70">Connect</span>
            <div className="w-8 h-0.5 bg-foreground/30 rounded-full" />
            <div className="flex gap-2">
              <a aria-label="LinkedIn" href="https://www.linkedin.com/in/yukesh-kumar-a01647322" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20"><Linkedin className="w-4 h-4" /></a>
              <a aria-label="Instagram" href="https://instagram.com/yuk3shh" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20"><Instagram className="w-4 h-4" /></a>
              <a aria-label="Email" href="mailto:mailtoyukesh33@gmail.com" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20"><Mail className="w-4 h-4" /></a>
              <a aria-label="WhatsApp" href="https://wa.me/918189936361" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:scale-110 hover:text-primary transition-all duration-200 border-2 border-foreground/20"><MessageCircle className="w-4 h-4" /></a>
            </div>
          </div>
        </PointerTilt>
      </div>

      <Clock />

      <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </section>
  );
};

export default HomePage;
