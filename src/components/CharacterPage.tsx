import { useState, useEffect } from "react";
import profileImage from "@/assets/profile.jpg";

const CharacterPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsVisible, setStatsVisible] = useState<boolean[]>([]);

  const stats = [
    { label: "Player", value: "Yukesh Kumar", icon: "🎮", section: "main" },
    { label: "Role", value: "Main Character (Early Game)", icon: "⚔️", section: "main" },
    { label: "Level", value: "Loading...", icon: "📊", isLoading: true, section: "main" },
    { label: "XP", value: "Earned through mistakes", icon: "✨", section: "main" },
    { label: "Gold", value: "Not enough (yet)", icon: "💰", section: "main" },
    { label: "Weakness", value: "Consistency, Attention", icon: "💔", section: "main" },
  ];

  const allies = ["Curiosity", "Discipline (sometimes)", "Late-night focus"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Staggered stats animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatsLoaded(true);
    }, 800);

    // Stagger each stat line
    const delays = [1200, 1400, 1600, 1800, 2000, 2200, 2500, 2800];
    delays.forEach((delay, index) => {
      setTimeout(() => {
        setStatsVisible(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, delay);
    });

    return () => clearTimeout(timeout);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
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
    <section className="min-h-screen flex items-end relative overflow-hidden page-transition">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-transparent" />
      <div className="absolute top-0 right-0 w-3/5 h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-background" />
      </div>
      
      {/* Subtle film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Profile image on right side - STATIC, NO BREATHING ANIMATION */}
      <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-3/5 overflow-hidden">
        <img 
          src={profileImage} 
          alt="Yukesh Kumar" 
          className="h-full w-full object-cover object-[65%_top] md:object-[center_top] opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        {/* Additional mobile gradient for better text visibility */}
        <div className="absolute inset-0 md:hidden bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 pb-20 md:pb-24">
        <div className="max-w-md">
          {/* Main title with cinematic reveal */}
          <div className="character-name-reveal mb-6">
            <h1 className="font-display text-2xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wider">
              <span className="text-primary text-glow-subtle">Yukesh</span>
              <br />
              <span className="text-foreground">Kumar</span>
            </h1>
          </div>

          {/* RPG Status Panel - Minimalist Dark Cinematic Style */}
          <div 
            className={`rpg-panel transition-all duration-700 ease-out ${
              statsLoaded ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-sm"
            }`}
          >
            <div className="rpg-panel-inner glass rounded-xl p-4 md:p-5 border border-primary/10 relative overflow-hidden">
              {/* Panel ambient glow */}
              <div className="absolute inset-0 rpg-ambient-glow" />
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent rpg-accent-line" />
              
              {/* Stats content */}
              <div className="relative z-10 space-y-2">
                {stats.map((stat, index) => (
                  <div 
                    key={stat.label}
                    className={`flex items-start gap-2 transition-all duration-700 ease-out ${
                      statsVisible[index] 
                        ? "opacity-100 translate-x-0" 
                        : "opacity-0 -translate-x-1"
                    }`}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    <span className="text-sm opacity-70 flex-shrink-0">{stat.icon}</span>
                    <span className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider min-w-[55px] md:min-w-[65px] flex-shrink-0">
                      {stat.label}:
                    </span>
                    <span className={`text-[10px] md:text-xs font-mono ${
                      stat.isLoading ? "rpg-loading-shimmer" : "text-foreground/90 text-glow-hover"
                    }`}>
                      {stat.value}
                    </span>
                  </div>
                ))}

                {/* Allies Section */}
                <div 
                  className={`pt-2 mt-2 border-t border-primary/10 transition-all duration-700 ease-out ${
                    statsVisible[6] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm opacity-70 flex-shrink-0">🤝</span>
                    <span className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider min-w-[55px] md:min-w-[65px] flex-shrink-0">
                      Allies:
                    </span>
                    <span className="text-[10px] md:text-xs font-mono text-foreground/80">
                      {allies.join(" • ")}
                    </span>
                  </div>
                </div>

                {/* Status Section */}
                <div 
                  className={`pt-2 mt-1 transition-all duration-700 ease-out ${
                    statsVisible[7] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm opacity-70 flex-shrink-0">🟢</span>
                    <span className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider min-w-[55px] md:min-w-[65px] flex-shrink-0">
                      Status:
                    </span>
                    <div className="text-[10px] md:text-xs font-mono">
                      <span className="text-primary/80">Online at 2:46 AM</span>
                      <br />
                      <span className="text-foreground/60 italic">Ignoring sleep like a side quest</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Time/Date display - absolute bottom of page */}
      <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 z-20 character-time-reveal">
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-muted-foreground/50 font-mono">
          <span className="time-pulse">{formatTime(currentTime)}</span>
          <span className="opacity-40">|</span>
          <span className="date-fade">{formatDate(currentTime)}</span>
        </div>
      </div>
    </section>
  );
};

export default CharacterPage;
