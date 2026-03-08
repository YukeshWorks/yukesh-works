import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, FolderOpen, ArrowRight, Sparkles } from "lucide-react";

interface WelcomePageProps {
  onBack: () => void;
}

const WelcomePage = ({ onBack }: WelcomePageProps) => {
  const [show, setShow] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    setTimeout(() => setShowTitle(true), 400);
    setTimeout(() => setShowSubtitle(true), 700);
    setTimeout(() => setShowCard(true), 1000);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/3" />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[100px] transition-all duration-[2000ms]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)",
            opacity: show ? 1 : 0,
            transform: `translate(-50%, 0) scale(${show ? 1 : 0.5})`,
          }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-24 left-6 glass px-4 py-2 rounded-full flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg mx-auto text-center">
        {/* Icon */}
        <div
          className="mb-6 transition-all duration-700"
          style={{
            opacity: show ? 1 : 0,
            transform: `scale(${show ? 1 : 0}) rotate(${show ? 0 : -180}deg)`,
          }}
        >
          <div className="p-4 rounded-full glass border border-primary/20">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3 transition-all duration-700"
          style={{
            opacity: showTitle ? 1 : 0,
            transform: `translateY(${showTitle ? 0 : 24}px)`,
          }}
        >
          Welcome to the Vault
        </h1>

        {/* Subtitle */}
        <p
          className="text-muted-foreground text-base md:text-lg mb-10 transition-all duration-700"
          style={{
            opacity: showSubtitle ? 1 : 0,
            transform: `translateY(${showSubtitle ? 0 : 16}px)`,
          }}
        >
          You've cracked the code. Here's your reward.
        </p>

        {/* Drive Card */}
        <a
          href="https://drive.google.com/drive/folders/1VMYgLwCL_VjV92Wjs48wCzkRv5dAOrSw"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full transition-all duration-700"
          style={{
            opacity: showCard ? 1 : 0,
            transform: `translateY(${showCard ? 0 : 30}px)`,
          }}
        >
          <div
            className="glass rounded-2xl p-7 hover:scale-[1.02] transition-all duration-500 cursor-pointer relative overflow-hidden border border-primary/10 hover:border-primary/25"
            style={{
              boxShadow: "0 0 40px hsl(var(--primary) / 0.06)",
            }}
          >
            <div className="absolute inset-0 bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-3.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                <FolderOpen className="w-7 h-7 text-primary" />
              </div>

              <div>
                <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-1.5">
                  Access the Files
                </h2>
                <p className="text-muted-foreground text-sm">
                  Open the shared Google Drive folder
                </p>
              </div>

              <div className="flex items-center gap-2 text-primary text-sm font-medium mt-1 group-hover:gap-3 transition-all duration-300">
                <span>Open Drive</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-8 text-center text-[10px] text-muted-foreground/20 tracking-widest uppercase">
        <p>🔓 Access Granted</p>
      </div>
    </section>
  );
};

export default WelcomePage;
