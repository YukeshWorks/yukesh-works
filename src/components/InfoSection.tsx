import { useState } from "react";
import { Instagram, Facebook } from "lucide-react";
import profileHero from "@/assets/profile-hero.png";
import pixelEyes from "@/assets/pixel-eyes.gif";

const InfoSection = () => {
  const [showContent, setShowContent] = useState(false);

  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden page-transition bg-background">
      {/* Full-screen photo background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={profileHero}
          alt="Yukesh"
          className="h-full w-auto max-w-none object-contain object-center opacity-75 md:opacity-85"
          style={{ minHeight: '100vh' }}
        />
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
      </div>

      {/* Floating "About Me" button - shown when content is hidden */}
      {!showContent && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <button
            onClick={() => setShowContent(true)}
            className="group relative animate-[float_3s_ease-in-out_infinite] cursor-pointer"
          >
            <div className="px-8 py-4 rounded-2xl glass border border-primary/30 hover:border-primary/60 transition-all duration-500 hover:scale-110">
              <span className="text-lg md:text-2xl font-bold font-display gradient-text tracking-wider">
                About Me
              </span>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border border-primary/20 animate-ping" />
          </button>
        </div>
      )}

      {/* Content overlay - shown after clicking About Me */}
      {showContent && (
        <div className="relative z-10 flex-1 flex items-end md:items-center pb-16 md:pb-0 fade-in-up">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-md">
              {/* Title with vertical accent line */}
              <div className="fade-in-up opacity-0 delay-200 relative pl-5 border-l-2 border-primary/40">
                <h1 className="text-3xl md:text-5xl text-foreground font-display leading-tight">
                  The Guy You'll
                  <br />
                  <span className="gradient-text">Vibe With</span>
                </h1>
              </div>

              {/* Description */}
              <div className="fade-in-up opacity-0 delay-400 mt-6">
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  I Mess Around With Whatever Catches My Attention (For As Long As I Remember It). 
                  Kinda Forgetful, A Little Off-Minded, Not The Most Responsible Guy—
                </p>
                <div className="mt-4 pl-5 border-l border-primary/30">
                  <p className="text-foreground font-display text-lg md:text-xl italic">
                    "But Hey, I'm Easy To Vibe With!"
                  </p>
                </div>
              </div>

              {/* Pixel Eyes GIF */}
              <div className="fade-in-up opacity-0 delay-500 mt-6 flex items-center gap-3">
                <img src={pixelEyes} alt="Pixel eyes" className="w-12 h-12 rounded-lg" />
              </div>

              {/* Social */}
              <div className="fade-in-up opacity-0 delay-600 mt-6">
                <div className="flex items-center gap-1 mb-3">
                  <div className="w-8 h-[1px] bg-primary/40" />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground px-2 font-heading">Connect</span>
                  <div className="flex-1 h-[1px] bg-border/50" />
                </div>
                <div className="flex items-center gap-5">
                  <a 
                    href="https://instagram.com/yuk3shh" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    <Instagram size={16} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-medium">@yuk3shh</span>
                  </a>
                  <a 
                    href="https://facebook.com/yukeshkumar" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    <Facebook size={16} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-medium">yukeshkumar</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating "That's Me" label pointing at photo */}
      {showContent && (
        <div className="absolute right-6 md:right-16 top-1/3 z-10 fade-in-up opacity-0 delay-500 hidden md:flex items-center gap-0">
          <div className="px-3 py-1.5 rounded-l-full glass border border-primary/20 border-r-0">
            <span className="text-[9px] font-heading uppercase tracking-[0.3em] text-primary whitespace-nowrap">
              That's Me
            </span>
          </div>
          <div 
            className="w-0 h-0"
            style={{
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '8px solid hsl(var(--primary) / 0.3)',
            }}
          />
        </div>
      )}
    </section>
  );
};

export default InfoSection;
