import { Instagram, Facebook } from "lucide-react";
import profileHero from "@/assets/profile-hero.png";

const InfoSection = () => {
  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden page-transition bg-background">
      <div className="flex-1 flex items-center justify-center py-20 md:py-0">
        <div className="container mx-auto px-6 md:px-12">
          {/* Magazine-style split layout */}
          <div className="relative flex flex-col md:flex-row items-center md:items-stretch gap-0">
            
            {/* Left column - Editorial text block */}
            <div className="relative z-10 flex flex-col justify-center md:w-1/2 md:pr-12 order-2 md:order-1 mt-8 md:mt-0">
              {/* Large decorative number */}
              <div className="fade-in-up opacity-0 delay-100">
                <span className="text-[8rem] md:text-[12rem] font-bold leading-none gradient-text opacity-10 font-display select-none absolute -top-8 md:-top-16 -left-4 md:-left-8">
                  01
                </span>
              </div>

              {/* Title with vertical accent line */}
              <div className="fade-in-up opacity-0 delay-200 relative pl-6 border-l-2 border-primary/40">
                <p className="text-primary text-[10px] uppercase tracking-[0.4em] mb-3 font-medium">Who Am I</p>
                <h1 className="text-3xl md:text-5xl font-bold text-foreground font-display leading-tight">
                  The Guy You'll
                  <br />
                  <span className="gradient-text">Vibe With</span>
                </h1>
              </div>

              {/* Description with pull-quote style */}
              <div className="fade-in-up opacity-0 delay-400 mt-8">
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-sm">
                  I Mess Around With Whatever Catches My Attention (For As Long As I Remember It). 
                  Kinda Forgetful, A Little Off-Minded, Not The Most Responsible Guy—
                </p>
                <div className="mt-6 pl-6 border-l border-primary/30">
                  <p className="text-foreground font-display text-lg md:text-xl font-semibold italic">
                    "But Hey, I'm Easy To Vibe With!"
                  </p>
                </div>
              </div>

              {/* Social row - minimal line style */}
              <div className="fade-in-up opacity-0 delay-600 mt-10">
                <div className="flex items-center gap-1 mb-4">
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

            {/* Right column - Photo with frame treatment */}
            <div className="relative md:w-1/2 flex justify-center md:justify-end order-1 md:order-2 fade-in-up opacity-0 delay-200">
              <div className="relative">
                {/* Photo container with clipped shape */}
                <div className="relative w-56 h-72 md:w-[22rem] md:h-[30rem] overflow-hidden rounded-[2rem] md:rounded-[3rem]">
                  <img
                    src={profileHero}
                    alt="Yukesh"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Bottom gradient fade */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
                </div>

                {/* Decorative corner brackets */}
                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-primary/50 rounded-tl-lg" />
                <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-primary/50 rounded-tr-lg" />
                <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-primary/50 rounded-bl-lg" />
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-primary/50 rounded-br-lg" />

                {/* Floating label on the side */}
                <div className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 fade-in-up opacity-0 delay-500">
                  <div className="flex items-center gap-0">
                    {/* Triangle pointing left */}
                    <div 
                      className="w-0 h-0"
                      style={{
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: '8px solid hsl(var(--primary) / 0.3)',
                      }}
                    />
                    <div className="px-3 py-1.5 rounded-r-full glass border border-primary/20 border-l-0">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                        That's Me
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ambient glow behind photo */}
                <div className="absolute -inset-8 -z-10 rounded-[4rem] bg-primary/5 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
