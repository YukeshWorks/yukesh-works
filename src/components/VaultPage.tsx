import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Brain, TreePalm, ArrowLeft, Joystick, Worm, Footprints, Rocket, Ghost, Swords } from "lucide-react";
import SnakeGame from "./SnakeGame";
import RainbowScratch from "./RainbowScratch";
import MemoryGame from "./MemoryGame";
import IslandCreator from "./IslandCreator";
import DinoGame from "./DinoGame";
import OrbitForgeGame from "./OrbitForgeGame";
import ChessGame from "./ChessGame";
import Nine17Game from "./Nine17Game";
import UmbraDuelGame from "./UmbraDuelGame";
import { KnightIcon } from "./chessPieces";
import LampScene from "./LampScene";
import { onNavigate, takePending, clearPending, trackGame, type GameId } from "@/lib/siteEvents";

type VaultSection = "main" | "games-menu" | "snake" | "scratch" | "memory" | "island" | "dino" | "orbit" | "chess" | "nine17" | "umbra";

type IconComp = React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;
const VAULT_ITEMS: { id: VaultSection; icon: IconComp; title: string; subtitle: string; accent: string }[] = [
  { id: "snake", icon: Worm, title: "Snake Glide", subtitle: "Eat, grow, don't crash", accent: "45, 212, 191" },
  { id: "scratch", icon: Sparkles, title: "Rainbow Scratch", subtitle: "Reveal hidden colors", accent: "232, 121, 249" },
  { id: "memory", icon: Brain, title: "Memory Match", subtitle: "Find all the pairs", accent: "167, 139, 250" },
  { id: "island", icon: TreePalm, title: "Island Creator", subtitle: "Build your paradise", accent: "56, 189, 248" },
  { id: "dino", icon: Footprints, title: "Chrome Dino", subtitle: "Jump the cactus", accent: "251, 191, 36" },
  { id: "chess", icon: KnightIcon, title: "Chess Arena", subtitle: "Play the computer or a friend online", accent: "245, 200, 107" },
  { id: "orbit", icon: Rocket, title: "Orbit Forge", subtitle: "Build rockets, fly the cosmos", accent: "255, 180, 84" },
  { id: "nine17", icon: Ghost, title: "The 9:17", subtitle: "A ghost story at a dead station", accent: "143, 196, 207" },
  { id: "umbra", icon: Swords, title: "Umbra Duel", subtitle: "Silhouette sword fights, 2 players", accent: "239, 108, 92" },
];

// Card that tilts toward the cursor and carries a spotlight under it.
const TiltCard = ({ item, index, onOpen }: { item: (typeof VAULT_ITEMS)[number]; index: number; onOpen: () => void }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 14}deg) rotateY(${(px - 0.5) * 16}deg) translateZ(6px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  const Icon = item.icon;
  const isLastOdd = index === VAULT_ITEMS.length - 1 && VAULT_ITEMS.length % 2 === 1;
  return (
    <div className={isLastOdd ? "col-span-2 flex justify-center" : ""} style={{ animation: `vaultCardIn 0.7s cubic-bezier(0.16,1,0.3,1) ${0.15 + index * 0.08}s both` }}>
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`vault-card group relative overflow-hidden rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center cursor-pointer ${isLastOdd ? "w-[calc(50%-0.375rem)]" : "w-full"}`}
        style={{ ["--accent" as string]: item.accent }}
      >
        <span className="vault-card-spot" aria-hidden="true" />
        <div className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
          style={{ background: `rgba(${item.accent}, 0.12)`, boxShadow: `0 0 0 1px rgba(${item.accent}, 0.25)` }}>
          <Icon size={19} style={{ color: `rgb(${item.accent})` }} className="transition-transform duration-500 group-hover:scale-110" />
        </div>
        <div className="relative">
          <h3 className="font-display text-xs font-bold text-white/85 group-hover:text-white transition-colors duration-300">{item.title}</h3>
          <p className="text-white/35 text-[10px] mt-0.5 group-hover:text-white/55 transition-colors duration-300">{item.subtitle}</p>
        </div>
        <span className="relative text-[9px] font-bold uppercase tracking-[0.2em] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" style={{ color: `rgb(${item.accent})` }}>
          Play →
        </span>
      </button>
    </div>
  );
};

const VaultPage = () => {
  // A game picked in the command palette opens straight away.
  const [activeSection, setActiveSection] = useState<VaultSection>(() => {
    const p = takePending(["game", "games-menu"]);
    return p?.kind === "game" ? p.game : p?.kind === "games-menu" ? "games-menu" : "main";
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // The Games button appears once the lamp has flickered on.
  const handleLampReady = useCallback(() => setContentVisible(true), []);

  useEffect(() => {
    if (activeSection !== "main" && activeSection !== "games-menu") trackGame(activeSection as GameId);
  }, [activeSection]);

  const navigateRef = useRef<(s: VaultSection) => void>(() => {});
  useEffect(() => onNavigate(req => {
    if (req.kind === "game") { clearPending(); navigateRef.current(req.game); }
    if (req.kind === "games-menu") { clearPending(); navigateRef.current("games-menu"); }
  }), []);

  const navigateTo = (section: VaultSection) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(section);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  navigateRef.current = navigateTo;

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
        <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-28 md:pt-16 page-transition">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2b0f3a_0%,#06050a_60%)]" />
          <div className="absolute top-1/4 right-1/5 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/4 left-1/5 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />
          <div className="relative z-10 flex flex-col items-center gap-4 pt-8 pb-10">
            <div className="text-center mb-1 fade-in-up">
              <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="text-white">Rainbow</span>
                <span className="ml-2 bg-gradient-to-r from-rose-400 via-amber-300 to-sky-400 bg-clip-text text-transparent">Scratch</span>
              </h2>
              <p className="text-white/40 text-xs mt-1">Scratch the foil. Something colourful is hiding.</p>
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
  if (activeSection === "chess") {
    return <div className={transClass}>{backButton("games-menu")}<ChessGame /></div>;
  }
  if (activeSection === "umbra") {
    return <div className={transClass}>{backButton("games-menu")}<UmbraDuelGame /></div>;
  }
  if (activeSection === "nine17") {
    return <div className={transClass}>{backButton("games-menu")}<Nine17Game /></div>;
  }
  if (activeSection === "orbit") {
    return <div className={transClass}>{backButton("games-menu")}<OrbitForgeGame /></div>;
  }

  if (activeSection === "dino") {
    return <div className={transClass}>{backButton("games-menu")}<DinoGame /></div>;
  }

  // Games submenu
  if (activeSection === "games-menu") {
    return (
      <section className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 ${isTransitioning ? 'animate-[pageFadeOut_0.3s_ease-in_forwards]' : 'page-transition'}`}>
        <div className="absolute inset-0 bg-black" />
        <LampScene instant opacity={0.35} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

        {backButton("main")}

        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-4">
          <div className="text-center fade-in-up">
            <Joystick className="mx-auto mb-3 text-white/70" size={28} style={{ animation: "vaultJoy 2.8s ease-in-out infinite" }} />
            <h2 className="font-display text-2xl font-bold text-white tracking-wider">
              Games
            </h2>
            <p className="text-white/30 text-xs mt-1 tracking-wide">Select your challenge</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {VAULT_ITEMS.map((item, i) => (
              <TiltCard key={item.id} item={item} index={i} onOpen={() => navigateTo(item.id)} />
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
      <LampScene onReady={handleLampReady}>
        <div
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
            transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <button
            onClick={() => navigateTo("games-menu")}
            className="vault-games-btn group relative rounded-xl px-8 py-3 flex items-center gap-3 cursor-pointer
                       hover:scale-[1.05] active:scale-[0.95] transition-transform duration-300"
          >
            <Joystick className="relative text-white/70 group-hover:text-white transition-colors duration-300 group-hover:-rotate-12" size={18} />
            <span className="relative font-display text-sm font-bold text-white/85 group-hover:text-white transition-colors duration-300 tracking-widest uppercase">
              Games
            </span>
          </button>
        </div>
      </LampScene>
    </section>
  );
};

export default VaultPage;
