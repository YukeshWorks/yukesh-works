import { useState } from "react";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import profileHero from "@/assets/profile-hero.webp";
import pixelEyes from "@/assets/pixel-eyes.gif";

const InfoSection = () => {
  const [showContent, setShowContent] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden page-transition bg-background">
      {/* Full-screen photo background */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end">
        <img
          src={profileHero}
          alt="Yukesh"
          decoding="sync"
          loading="eager"
          fetchPriority="high"
          className="h-full w-auto max-w-none object-contain object-center md:object-right"
          style={{
            minHeight: '100vh',
            contentVisibility: 'auto',
            opacity: imgLoaded ? 0.9 : 0,
            transition: 'opacity 0.8s ease-out',
          }}
          onLoad={() => setImgLoaded(true)}
        />
        <div className="hidden md:block absolute inset-0" style={{
          background: `
            linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 15%, transparent 40%, transparent 60%, hsl(var(--background) / 0.85) 85%, hsl(var(--background)) 100%),
            linear-gradient(to bottom, hsl(var(--background) / 0.5) 0%, transparent 15%, transparent 85%, hsl(var(--background) / 0.7) 100%)
          `
        }} />
      </div>

      {/* About Me button — bottom-left, compact, animated */}
      {!showContent && (
        <div className="absolute bottom-20 left-6 md:left-12 z-20">
          <button
            onClick={() => setShowContent(true)}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            className="group relative cursor-pointer flex items-center gap-3"
          >
            {/* Pulse ring */}
            <div
              className="absolute -inset-3 rounded-2xl pointer-events-none"
              style={{
                border: "1px solid hsl(var(--primary) / 0.15)",
                animation: "aboutPulseRing 2.5s ease-in-out infinite",
                opacity: btnHover ? 0 : 1,
              }}
            />

            {/* Button */}
            <div
              className="relative px-4 py-2 rounded-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--card) / 0.5), hsl(var(--card) / 0.3))",
                backdropFilter: "blur(16px)",
                border: `1px solid hsl(var(--primary) / ${btnHover ? 0.4 : 0.2})`,
                boxShadow: btnHover
                  ? "0 0 24px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--foreground) / 0.05)"
                  : "0 0 0 hsl(var(--primary) / 0), inset 0 1px 0 hsl(var(--foreground) / 0.05)",
                transform: btnHover ? "scale(1.05)" : "scale(1)",
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Sweep light */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.08) 50%, transparent 60%)",
                  animation: "aboutSweep 3s ease-in-out infinite",
                }}
              />
              <span className="relative z-10 text-[10px] md:text-xs font-display tracking-[0.2em] uppercase text-foreground/80 group-hover:text-primary transition-colors duration-300">
                About Me
              </span>
            </div>

            {/* Arrow */}
            <div
              className="text-primary/50 group-hover:text-primary transition-all duration-300"
              style={{
                transform: btnHover ? "translateX(4px)" : "translateX(0)",
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              →
            </div>
          </button>
        </div>
      )}

      {/* Content overlay */}
      {showContent && (
        <div className="relative z-10 flex-1 flex items-end pb-20 md:items-end md:pb-16 fade-in-up">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-sm">
              <div className="fade-in-up opacity-0 delay-200 relative pl-4 border-l-2 border-primary/40">
                <h1 className="text-2xl md:text-3xl text-foreground font-display leading-tight">
                  The Guy You'll<br />
                  <span className="gradient-text">Vibe With</span>
                </h1>
              </div>

              <div className="fade-in-up opacity-0 delay-400 mt-4">
                <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
                  I Mess Around With Whatever Catches My Attention. 
                  Kinda Forgetful, A Little Off-Minded—
                </p>
                <div className="mt-3 pl-4 border-l border-primary/30">
                  <p className="text-foreground font-display text-sm md:text-base italic">
                    "But Hey, I'm Easy To Vibe With!"
                  </p>
                </div>
              </div>

              <div className="fade-in-up opacity-0 delay-500 mt-4">
                <img src={pixelEyes} alt="Pixel eyes" className="w-10 h-10 rounded-lg" />
              </div>

              <div className="fade-in-up opacity-0 delay-600 mt-4">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-6 h-[1px] bg-primary/40" />
                  <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground px-1.5 font-heading">Connect</span>
                  <div className="flex-1 h-[1px] bg-border/50" />
                </div>
                <div className="flex items-center gap-4">
                  <a href="https://instagram.com/yuk3shh" target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300">
                    <Instagram size={14} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-[10px] font-medium">@yuk3shh</span>
                  </a>
                  <a href="https://www.linkedin.com/in/yukesh-kumar-a01647322" target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300">
                    <Linkedin size={14} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-[10px] font-medium">LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "That's Me" label */}
      {showContent && (
        <div className="absolute right-4 md:right-16 top-[22%] md:top-1/3 z-10 fade-in-up opacity-0 delay-500 flex items-center gap-0">
          <div className="px-3 py-1.5 rounded-full glass border border-primary/30"
            style={{
              boxShadow: '0 0 12px hsl(var(--primary) / 0.15)',
              animation: 'thatsMeBounce 2s ease-in-out infinite',
            }}
          >
            <span className="text-[8px] md:text-[9px] font-heading uppercase tracking-[0.3em] text-primary whitespace-nowrap"
              style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.4)' }}>
              That's Me
            </span>
          </div>
          {/* Animated arrow pointing right toward photo */}
          <div className="ml-1 text-primary/60" style={{ animation: 'thatsMeArrow 1.5s ease-in-out infinite' }}>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M0 6h16M12 1l5 5-5 5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aboutPulseRing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0; }
        }
        @keyframes aboutSweep {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
        @keyframes thatsMeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes thatsMeArrow {
          0%, 100% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(5px); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default InfoSection;
