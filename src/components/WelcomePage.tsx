import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import projectsFolder from "@/assets/projects-folder.jpg";

interface WelcomePageProps {
  onBack: () => void;
}

const TITLE = "Welcome, Agent.";

/*
 * Entrance sequence (phase):
 * 1 hands slide in from both sides   2 folder pops in with a glow
 * 3 title types out                   4 subtitle   5 file card
 */
const WelcomePage = ({ onBack }: WelcomePageProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);

  // Start even if the image is slow, so the page never sits empty.
  useEffect(() => {
    const t = window.setTimeout(() => setImgLoaded(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!imgLoaded) return;
    const timers = [
      window.setTimeout(() => setPhase(1), 100),
      window.setTimeout(() => setPhase(2), 950),
      window.setTimeout(() => setPhase(3), 1400),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [imgLoaded]);

  // Typewriter for the title, then reveal the rest.
  useEffect(() => {
    if (phase < 3) return;
    if (typed < TITLE.length) {
      const t = window.setTimeout(() => setTyped(n => n + 1), 55);
      return () => window.clearTimeout(t);
    }
    const a = window.setTimeout(() => setPhase(p => Math.max(p, 4)), 150);
    const b = window.setTimeout(() => setPhase(p => Math.max(p, 5)), 450);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [phase, typed]);

  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-32 pb-16"
      style={{ background: "#000" }}>

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-24 left-6 px-4 py-2 rounded-full flex items-center gap-2 text-white/60 hover:text-white transition-all duration-300 hover:scale-105 z-20"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      {/* Artwork sits in the flow above the text, so nothing overlaps. */}
      <div
        className="relative w-[min(94vw,880px)] select-none pointer-events-none"
        style={{
          aspectRatio: "734 / 336",
          // Feather the artwork's edges into the page so no rectangle shows.
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
          maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
        }}
        aria-hidden="true"
      >
        <img src={projectsFolder} alt="" className="hidden" onLoad={() => setImgLoaded(true)} />

        {/* Left hand */}
        <img
          src={projectsFolder}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            clipPath: "inset(0 56% 0 0)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateX(0)" : "translateX(-12%)",
            transition: `opacity 0.9s ${ease}, transform 1.1s ${ease}`,
          }}
        />
        {/* Right hand */}
        <img
          src={projectsFolder}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            clipPath: "inset(0 0 0 53%)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateX(0)" : "translateX(12%)",
            transition: `opacity 0.9s ${ease}, transform 1.1s ${ease}`,
          }}
        />

        {/* Folder */}
        <img
          src={projectsFolder}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            clipPath: "inset(0 47% 0 44%)",
            transformOrigin: "47.5% 50%",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "scale(1)" : "scale(0.4)",
            transition: "opacity 0.4s ease-out, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
            animation: phase >= 3 ? "welcomeFloat 4s ease-in-out infinite 0.7s" : "none",
          }}
        />
        {/* Glow over the folder (screen blend lights it without hiding it) */}
        <div
          className="absolute rounded-full"
          style={{
            left: "47.5%",
            top: "50%",
            width: "18%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0.08) 45%, transparent 70%)",
            opacity: phase >= 2 ? 1 : 0,
            transition: "opacity 0.8s ease-out",
            mixBlendMode: "screen",
            animation: phase >= 2 ? "welcomeGlow 3s ease-in-out infinite" : "none",
          }}
        />

      </div>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full mx-auto text-center mt-6">
        {/* Title */}
        <h1
          className="font-display text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-2 min-h-[1.3em]"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
          aria-label={TITLE}
        >
          <span aria-hidden="true">{TITLE.slice(0, typed)}</span>
          <span
            aria-hidden="true"
            className="inline-block w-[0.08em] h-[0.9em] ml-1 align-[-0.05em] bg-sky-400"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              animation: "welcomeCaret 1s steps(1) infinite",
            }}
          />
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/50 text-sm md:text-base mb-8 tracking-wide"
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: `translateY(${phase >= 4 ? 0 : 12}px)`,
            transition: `opacity 0.7s ${ease}, transform 0.7s ${ease}`,
          }}
        >
          Access your classified files below.
        </p>

        {/* Drive link */}
        <a
          href="https://drive.google.com/drive/folders/1VMYgLwCL_VjV92Wjs48wCzkRv5dAOrSw"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full max-w-sm"
          style={{
            opacity: phase >= 5 ? 1 : 0,
            transform: `translateY(${phase >= 5 ? 0 : 20}px)`,
            transition: `opacity 0.7s ${ease}, transform 0.7s ${ease}`,
          }}
        >
          <div
            className="relative rounded-xl p-6 overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Light sweep across the card */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 35%, rgba(125,211,252,0.12) 50%, transparent 65%)",
                animation: phase >= 5 ? "welcomeSweep 3.5s ease-in-out infinite 0.6s" : "none",
                transform: "translateX(-100%)",
              }}
            />
            <div className="relative flex items-center justify-between">
              <div className="text-left">
                <p className="text-white text-sm font-display font-bold tracking-wide mb-1">
                  Open Files
                </p>
                <p className="text-white/40 text-xs">
                  Shared folder
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium group-hover:text-white/80 transition-colors duration-300">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Faint scanlines for the "classified" feel — on top so they cover the artwork evenly. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] z-[5]"
        style={{ background: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 4px)" }}
      />

      {/* Bottom accent */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 h-px bg-white/15"
        style={{
          width: phase >= 5 ? 48 : 0,
          transition: `width 1s ${ease}`,
        }}
      />

      <style>{`
        @keyframes welcomeGlow {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes welcomeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5%); }
        }
        @keyframes welcomeCaret {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes welcomeSweep {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default WelcomePage;
