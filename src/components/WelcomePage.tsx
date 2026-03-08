import { useState, useEffect } from "react";
import { ExternalLink, Sparkles, FolderOpen, ArrowRight } from "lucide-react";

const WelcomePage = () => {
  const [show, setShow] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    setTimeout(() => setShowTitle(true), 400);
    setTimeout(() => setShowSubtitle(true), 800);
    setTimeout(() => setShowCard(true), 1200);
    setTimeout(() => setShowParticles(true), 1600);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-[2000ms]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)",
            opacity: show ? 1 : 0,
            transform: `translate(-50%, 0) scale(${show ? 1 : 0.5})`,
          }}
        />
      </div>

      {/* Floating particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-6 max-w-2xl mx-auto text-center">
        {/* Sparkle icon */}
        <div
          className="mb-8 transition-all duration-700"
          style={{
            opacity: show ? 1 : 0,
            transform: `scale(${show ? 1 : 0}) rotate(${show ? 0 : -180}deg)`,
          }}
        >
          <div className="p-5 rounded-full glass glow-border">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4 transition-all duration-700"
          style={{
            opacity: showTitle ? 1 : 0,
            transform: `translateY(${showTitle ? 0 : 30}px)`,
          }}
        >
          Welcome to the Vault
        </h1>

        {/* Subtitle */}
        <p
          className="text-muted-foreground text-lg md:text-xl mb-12 max-w-md transition-all duration-700"
          style={{
            opacity: showSubtitle ? 1 : 0,
            transform: `translateY(${showSubtitle ? 0 : 20}px)`,
          }}
        >
          You've cracked the code. Here's what's inside.
        </p>

        {/* Google Drive Card */}
        <a
          href="https://drive.google.com/drive/folders/1VMYgLwCL_VjV92Wjs48wCzkRv5dAOrSw"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full max-w-md transition-all duration-700"
          style={{
            opacity: showCard ? 1 : 0,
            transform: `translateY(${showCard ? 0 : 40}px) scale(${showCard ? 1 : 0.9})`,
          }}
        >
          <div className="glass glow-border rounded-2xl p-8 hover:scale-[1.03] transition-all duration-500 cursor-pointer relative overflow-hidden">
            {/* Hover glow */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>

              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                  Access the Files
                </h2>
                <p className="text-muted-foreground text-sm">
                  Open the shared Google Drive folder
                </p>
              </div>

              <div className="flex items-center gap-2 text-primary text-sm font-medium mt-2 group-hover:gap-3 transition-all duration-300">
                <span>Open Drive</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 text-center text-xs text-muted-foreground/30">
        <p>🔓 Access Granted — Welcome Inside 🔓</p>
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
        }
      `}</style>
    </section>
  );
};

export default WelcomePage;
