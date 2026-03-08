import { useState } from "react";
import { Gamepad2, Sparkles, Brain, TreePalm, ArrowLeft, Joystick } from "lucide-react";
import SnakeGame from "./SnakeGame";
import RainbowScratch from "./RainbowScratch";
import MemoryGame from "./MemoryGame";
import IslandCreator from "./IslandCreator";
import vaultLamp from "@/assets/vault-lamp.gif";

type VaultSection = "main" | "games-menu" | "snake" | "scratch" | "memory" | "island";

const VAULT_ITEMS: { id: VaultSection; icon: typeof Gamepad2; title: string; subtitle: string; delay: string }[] = [
  { id: "snake", icon: Gamepad2, title: "Snake Game", subtitle: "Classic arcade vibes", delay: "delay-100" },
  { id: "scratch", icon: Sparkles, title: "Rainbow Scratch", subtitle: "Reveal hidden colors", delay: "delay-200" },
  { id: "memory", icon: Brain, title: "Memory Match", subtitle: "Find all the pairs", delay: "delay-300" },
  { id: "island", icon: TreePalm, title: "Island Creator", subtitle: "Build your paradise", delay: "delay-400" },
];

const VaultPage = () => {
  const [activeSection, setActiveSection] = useState<VaultSection>("main");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = (section: VaultSection) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(section);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const transClass = isTransitioning
    ? "animate-[pageFadeOut_0.3s_ease-in_forwards]"
    : "animate-[pageEnter_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]";

  const backButton = (target: VaultSection = "main") => (
    <button
      onClick={() => navigateTo(target)}
      className="fixed top-24 left-4 z-50 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );

  // Individual game views
  if (activeSection === "snake") {
    return <div className={transClass}>{backButton("games-menu")}<SnakeGame /></div>;
  }
  if (activeSection === "scratch") {
    return (
      <div className={transClass}>
        {backButton("games-menu")}
        <section className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden pt-16 page-transition">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-black" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float-slow" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="text-center mb-1">
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                <span className="text-white">Rainbow</span>
                <span className="text-white/50 ml-2">Scratch</span>
              </h2>
              <p className="text-white/40 text-xs mt-1">Scratch to reveal the hidden rainbow</p>
            </div>
            <RainbowScratch />
          </div>
        </section>
      </div>
    );
  }
  if (activeSection === "memory") {
    return <div className={transClass}>{backButton("games-menu")}<MemoryGame /></div>;
  }
  if (activeSection === "island") {
    return <div className={transClass}>{backButton("games-menu")}<IslandCreator /></div>;
  }

  // Games submenu
  if (activeSection === "games-menu") {
    return (
      <section className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 ${isTransitioning ? 'animate-[pageFadeOut_0.3s_ease-in_forwards]' : 'page-transition'}`}>
        <div className="absolute inset-0 bg-black" />
        <img
          src={vaultLamp}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

        {backButton("main")}

        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-4">
          <div className="text-center fade-in-up">
            <Joystick className="mx-auto mb-3 text-white/70" size={28} />
            <h2 className="font-display text-2xl font-bold text-white tracking-wider">
              Games
            </h2>
            <p className="text-white/30 text-xs mt-1 tracking-wide">Select your challenge</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {VAULT_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`group bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 flex flex-col items-center gap-2 text-center
                           hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.03] active:scale-[0.97]
                           transition-all duration-500 cursor-pointer
                           fade-in-up ${item.delay}`}
                style={{ opacity: 0 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center
                                group-hover:bg-white/[0.12] transition-all duration-500
                                group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <item.icon className="text-white/60 group-hover:text-white transition-colors duration-300" size={18} />
                </div>
                <div>
                  <h3 className="font-display text-xs font-bold text-white/80 group-hover:text-white transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-white/30 text-[9px] mt-0.5">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Main vault entrance
  return (
    <section className={`min-h-screen flex flex-col items-center relative overflow-hidden page-transition ${isTransitioning ? 'animate-[pageFadeOut_0.3s_ease-in_forwards]' : ''}`}>
      <div className="absolute inset-0 bg-black" />
      <img
        src={vaultLamp}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center mt-[45vh] ml-[7.5rem] fade-in-up delay-300" style={{ opacity: 0 }}>
        <button
          onClick={() => navigateTo("games-menu")}
          className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl px-8 py-3 flex items-center gap-3
                     hover:bg-white/[0.1] hover:border-white/20 hover:scale-[1.05] active:scale-[0.95]
                     transition-all duration-500 cursor-pointer
                     hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]
                     animate-[breatheGlow_3s_ease-in-out_infinite]"
        >
          <Joystick className="text-white/60 group-hover:text-white transition-colors duration-300" size={18} />
          <span className="font-display text-sm font-bold text-white/80 group-hover:text-white transition-colors duration-300 tracking-widest uppercase">
            Games
          </span>
        </button>
      </div>
    </section>
  );
};

export default VaultPage;
