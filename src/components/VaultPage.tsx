import { useState } from "react";
import { Gamepad2, Sparkles, ArrowLeft } from "lucide-react";
import SnakeGame from "./SnakeGame";
import RainbowScratch from "./RainbowScratch";

type VaultSection = "menu" | "snake" | "scratch";

const VaultPage = () => {
  const [activeSection, setActiveSection] = useState<VaultSection>("menu");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = (section: VaultSection) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(section);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  if (activeSection === "snake") {
    return (
      <div className={isTransitioning ? "animate-[pageFadeOut_0.3s_ease-in_forwards]" : "animate-[pageEnter_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"}>
        <button
          onClick={() => navigateTo("menu")}
          className="fixed top-24 left-4 z-50 glass px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors btn-glow"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <SnakeGame />
      </div>
    );
  }

  if (activeSection === "scratch") {
    return (
      <div className={isTransitioning ? "animate-[pageFadeOut_0.3s_ease-in_forwards]" : "animate-[pageEnter_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"}>
        <button
          onClick={() => navigateTo("menu")}
          className="fixed top-24 left-4 z-50 glass px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors btn-glow"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float-slow delay-300" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="text-center mb-2">
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                <span className="text-foreground">Rainbow</span>
                <span className="gradient-text ml-2">Scratch</span>
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                Scratch to reveal the hidden rainbow
              </p>
            </div>
            <RainbowScratch />
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition ${isTransitioning ? 'animate-[pageFadeOut_0.3s_ease-in_forwards]' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      
      {/* Ambient orbs */}
      <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-primary/8 rounded-full blur-3xl animate-float-slow delay-300" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center fade-in-up">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Vault</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Choose your adventure
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg w-full px-4">
          {/* Snake Game Card */}
          <button
            onClick={() => navigateTo("snake")}
            className="group glass rounded-2xl p-6 flex flex-col items-center gap-4 text-center
                       hover:scale-[1.04] active:scale-[0.97] transition-all duration-500 
                       cursor-pointer glow-border relative overflow-hidden
                       fade-in-up delay-100"
            style={{ opacity: 0 }}
          >
            {/* Hover glow sweep */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
            </div>
            
            <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center
                            group-hover:bg-primary/20 transition-colors duration-500
                            group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
              <Gamepad2 className="text-primary" size={28} />
              <div className="absolute inset-0 rounded-2xl border border-primary/20 
                              group-hover:border-primary/40 transition-colors duration-500
                              group-hover:animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            
            <div className="relative">
              <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                Snake Game
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                Classic arcade vibes
              </p>
            </div>
          </button>

          {/* Rainbow Scratch Card */}
          <button
            onClick={() => navigateTo("scratch")}
            className="group glass rounded-2xl p-6 flex flex-col items-center gap-4 text-center
                       hover:scale-[1.04] active:scale-[0.97] transition-all duration-500 
                       cursor-pointer glow-border relative overflow-hidden
                       fade-in-up delay-200"
            style={{ opacity: 0 }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(300,80%,50%,0.08)] via-transparent to-[hsl(40,90%,50%,0.05)]" />
            </div>
            
            <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center
                            group-hover:bg-primary/20 transition-colors duration-500
                            group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
              <Sparkles className="text-primary" size={28} />
              <div className="absolute inset-0 rounded-2xl border border-primary/20 
                              group-hover:border-primary/40 transition-colors duration-500
                              group-hover:animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            
            <div className="relative">
              <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                Rainbow Scratch
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                Reveal hidden colors
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default VaultPage;
