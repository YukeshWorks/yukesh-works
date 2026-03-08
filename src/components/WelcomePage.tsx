import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import projectsFolder from "@/assets/projects-folder.jpg";

interface WelcomePageProps {
  onBack: () => void;
}

const WelcomePage = ({ onBack }: WelcomePageProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!imgLoaded) return;
    setTimeout(() => setPhase(1), 200);
    setTimeout(() => setPhase(2), 600);
    setTimeout(() => setPhase(3), 1000);
  }, [imgLoaded]);

  return (
    <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Background image */}
      <img
        src={projectsFolder}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 1s ease-out',
        }}
        onLoad={() => setImgLoaded(true)}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-24 left-6 px-4 py-2 rounded-full flex items-center gap-2 text-white/60 hover:text-white transition-all duration-300 hover:scale-105 z-20"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg mx-auto text-center mt-32">
        {/* Title */}
        <h1
          className="font-display text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-2 transition-all duration-700"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: `translateY(${phase >= 1 ? 0 : 16}px)`,
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}
        >
          Welcome, Agent.
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/50 text-sm md:text-base mb-10 tracking-wide transition-all duration-700"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: `translateY(${phase >= 2 ? 0 : 12}px)`,
          }}
        >
          Access your classified files below.
        </p>

        {/* Drive link */}
        <a
          href="https://drive.google.com/drive/folders/1VMYgLwCL_VjV92Wjs48wCzkRv5dAOrSw"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full max-w-sm transition-all duration-700"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: `translateY(${phase >= 3 ? 0 : 20}px)`,
          }}
        >
          <div className="relative rounded-xl p-6 transition-all duration-400 group-hover:scale-[1.02]"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-white text-sm font-display font-bold tracking-wide mb-1">
                  Open Files
                </p>
                <p className="text-white/40 text-xs">
                  Shared folder
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium group-hover:text-white/80 transition-all duration-300">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-8 h-px bg-white/10 transition-all duration-1000"
        style={{ opacity: phase >= 3 ? 1 : 0 }}
      />
    </section>
  );
};

export default WelcomePage;
