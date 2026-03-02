import { Instagram, Facebook } from "lucide-react";
import profileHero from "@/assets/profile-hero.png";

const InfoSection = () => {
  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden page-transition bg-background">
      {/* Full-screen photo background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={profileHero}
          alt="Yukesh"
          className="h-full w-auto max-w-none object-contain object-center opacity-40 md:opacity-50"
          style={{ minHeight: '100vh' }}
        />
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex-1 flex items-end md:items-center pb-16 md:pb-0">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-md">
            {/* Large decorative number */}
            <div className="fade-in-up opacity-0 delay-100">
              <span className="text-[6rem] md:text-[10rem] font-bold leading-none gradient-text opacity-10 font-display select-none absolute -top-12 md:-top-20 -left-2 md:-left-6">
                01
              </span>
            </div>

            {/* Title with vertical accent line */}
            <div className="fade-in-up opacity-0 delay-200 relative pl-5 border-l-2 border-primary/40">
              <p className="text-primary text-[10px] uppercase tracking-[0.4em] mb-3 font-medium">Who Am I</p>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground font-display leading-tight">
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
                <p className="text-foreground font-display text-lg md:text-xl font-semibold italic">
                  "But Hey, I'm Easy To Vibe With!"
                </p>
              </div>
            </div>

            {/* Social */}
            <div className="fade-in-up opacity-0 delay-600 mt-8">
              <div className="flex items-center gap-1 mb-3">
                <div className="w-8 h-[1px] bg-primary/40" />
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground px-2">Connect</span>
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

      {/* Floating "That's Me" label pointing at photo */}
      <div className="absolute right-6 md:right-16 top-1/3 z-10 fade-in-up opacity-0 delay-500 hidden md:flex items-center gap-0">
        <div className="px-3 py-1.5 rounded-l-full glass border border-primary/20 border-r-0">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary whitespace-nowrap">
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
    </section>
  );
};

export default InfoSection;
