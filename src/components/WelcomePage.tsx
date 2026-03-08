import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";

interface WelcomePageProps {
  onBack: () => void;
}

const WelcomePage = ({ onBack }: WelcomePageProps) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 100);
    setTimeout(() => setPhase(2), 500);
    setTimeout(() => setPhase(3), 900);
    setTimeout(() => setPhase(4), 1300);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Subtle center glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full transition-all duration-[2500ms]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
          opacity: phase >= 1 ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${phase >= 1 ? 1.2 : 0.5})`,
        }}
      />

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-24 left-6 glass px-4 py-2 rounded-full flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg mx-auto text-center">
        {/* Thin line accent */}
        <div
          className="w-12 h-px bg-primary/40 mb-8 transition-all duration-700"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: `scaleX(${phase >= 1 ? 1 : 0})`,
          }}
        />

        {/* Title */}
        <h1
          className="font-display text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3 transition-all duration-700"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: `translateY(${phase >= 2 ? 0 : 16}px)`,
          }}
        >
          Welcome.
        </h1>

        {/* Subtitle */}
        <p
          className="text-muted-foreground text-sm md:text-base mb-12 tracking-wide transition-all duration-700"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: `translateY(${phase >= 3 ? 0 : 12}px)`,
          }}
        >
          Access granted.
        </p>

        {/* Drive link — clean card */}
        <a
          href="https://drive.google.com/drive/folders/1VMYgLwCL_VjV92Wjs48wCzkRv5dAOrSw"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full max-w-sm transition-all duration-700"
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: `translateY(${phase >= 4 ? 0 : 20}px)`,
          }}
        >
          <div className="relative rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 hover:border-primary/30 transition-all duration-400 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)]">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-foreground text-sm font-display font-bold tracking-wide mb-1">
                  Open Files
                </p>
                <p className="text-muted-foreground text-xs">
                  Shared folder
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-primary text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Bottom line */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-8 h-px bg-muted-foreground/15 transition-all duration-1000"
        style={{ opacity: phase >= 4 ? 1 : 0 }}
      />
    </section>
  );
};

export default WelcomePage;
