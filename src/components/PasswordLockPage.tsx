import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, ShieldCheck, ShieldX, CheckCircle2 } from "lucide-react";
import skeletonGif from "@/assets/skeleton-red.gif";
import redEyesGif from "@/assets/red-eyes.gif";
import wrongPasscodeVideo from "@/assets/wrong-passcode.mp4";

const playClickSound = (pitch = 1) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 800 * pitch;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
};

const playUnlockSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {}
};

const playErrorSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [200, 160].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch {}
};

const playFailureSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Deep doom impact
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impact.connect(impactGain);
    impactGain.connect(ctx.destination);
    impact.type = "sawtooth";
    impact.frequency.setValueAtTime(80, ctx.currentTime);
    impact.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);
    impactGain.gain.setValueAtTime(0.2, ctx.currentTime);
    impactGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    impact.start();
    impact.stop(ctx.currentTime + 1.8);
    // Alarm beeps
    [0, 0.25, 0.5].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 300;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    });
    // Static noise
    const bufSize = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    const ns = ctx.createBufferSource();
    const ng = ctx.createGain();
    ns.buffer = buf;
    ns.connect(ng);
    ng.connect(ctx.destination);
    ng.gain.setValueAtTime(0.06, ctx.currentTime + 0.1);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    ns.start(ctx.currentTime + 0.1);
  } catch {}
};

const playIntroSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Deep rumble
    const rumbleOsc = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumbleOsc.type = "sawtooth";
    rumbleOsc.frequency.setValueAtTime(45, ctx.currentTime);
    rumbleOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.8);
    rumbleGain.gain.setValueAtTime(0, ctx.currentTime);
    rumbleGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    rumbleGain.gain.setValueAtTime(0.12, ctx.currentTime + 1.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
    rumbleOsc.start();
    rumbleOsc.stop(ctx.currentTime + 2.2);

    // Eerie high tone
    const highOsc = ctx.createOscillator();
    const highGain = ctx.createGain();
    highOsc.connect(highGain);
    highGain.connect(ctx.destination);
    highOsc.type = "sine";
    highOsc.frequency.setValueAtTime(880, ctx.currentTime);
    highOsc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 2);
    highGain.gain.setValueAtTime(0, ctx.currentTime);
    highGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
    highGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    highOsc.start();
    highOsc.stop(ctx.currentTime + 2);

    // Static noise burst
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noiseSource.start();

    // Impact hit
    const impactOsc = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impactOsc.connect(impactGain);
    impactGain.connect(ctx.destination);
    impactOsc.type = "triangle";
    impactOsc.frequency.setValueAtTime(120, ctx.currentTime);
    impactOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    impactGain.gain.setValueAtTime(0.2, ctx.currentTime);
    impactGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    impactOsc.start();
    impactOsc.stop(ctx.currentTime + 0.4);
  } catch {}
};

interface PasswordLockPageProps {
  onBack: () => void;
  onUnlock: () => void;
}

const correctPassword = "0001";

const PasswordLockPage = ({ onBack, onUnlock }: PasswordLockPageProps) => {
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [successPhase, setSuccessPhase] = useState(0);
  const [showErrorVideo, setShowErrorVideo] = useState(false);
  const errorVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-dismiss intro after 2.5s + play intro sound
  useEffect(() => {
    if (!showIntro) return;
    playIntroSound();
    const t1 = setTimeout(() => setIntroFading(true), 2000);
    const t2 = setTimeout(() => setShowIntro(false), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showIntro]);

  const handleDigit = useCallback((digit: string) => {
    if (status === "success") return;
    if (activeIndex >= 4) return;

    playClickSound(1 + activeIndex * 0.08);

    const newDigits = [...digits];
    newDigits[activeIndex] = digit;
    setDigits(newDigits);
    setStatus("idle");

    if (activeIndex === 3) {
      const code = newDigits.join("");
      setTimeout(() => {
        if (code === correctPassword) {
          setStatus("success");
          playUnlockSound();
          setSuccessPhase(1);
          setTimeout(() => setSuccessPhase(2), 600);
          setTimeout(() => setSuccessPhase(3), 1400);
          setTimeout(onUnlock, 2200);
        } else {
          setStatus("error");
          playErrorSound();
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setShake(true);
          if (newAttempts >= 2) {
            // Show fullscreen error video on 2nd wrong attempt
            setTimeout(() => {
              setShake(false);
              setShowErrorVideo(true);
              playFailureSound();
            }, 500);
          } else {
            setTimeout(() => {
              setShake(false);
              setDigits(["", "", "", ""]);
              setActiveIndex(0);
              setStatus("idle");
            }, 800);
          }
        }
      }, 200);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  }, [digits, activeIndex, status, onUnlock]);

  const handleDelete = useCallback(() => {
    if (status === "success") return;
    if (activeIndex === 0 && digits[0] === "") return;
    playClickSound(0.8);
    const idx = digits[activeIndex] !== "" ? activeIndex : activeIndex - 1;
    if (idx < 0) return;
    const newDigits = [...digits];
    newDigits[idx] = "";
    setDigits(newDigits);
    setActiveIndex(idx);
    setStatus("idle");
  }, [digits, activeIndex, status]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleDigit, handleDelete]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", ""];

  return (
    <>
    {/* Fullscreen error video on 2nd wrong attempt */}
    {showErrorVideo && (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
        style={{ animation: 'pageFadeIn 0.4s ease-out' }}>
        <video
          src={wrongPasscodeVideo}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.8 }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 mt-auto mb-24">
          <p className="text-red-400 text-xs font-display tracking-[0.2em] uppercase"
            style={{ textShadow: '0 0 10px rgba(220,38,38,0.5)', animation: 'pageFadeIn 0.5s ease-out 0.5s both' }}>
            Wrong passcode
          </p>
          <button
            onClick={() => {
              setShowErrorVideo(false);
              setDigits(["", "", "", ""]);
              setActiveIndex(0);
              setStatus("idle");
              setAttempts(0);
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-display tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: 'rgba(220, 38, 38, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.1)',
              animation: 'pageFadeIn 0.5s ease-out 0.8s both',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )}
    {showIntro && (
      <div className="fixed inset-0 z-[9999] bg-black" style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}>
        <img
          src={skeletonGif}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            opacity: introFading ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            filter: 'brightness(1.3) contrast(1.2)',
          }}
        />
      </div>
    )}
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden page-transition bg-background">
      {/* Skeleton GIF background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Red eyes GIF when typing — blend black bg into dark background */}
        <img
          src={redEyesGif}
          alt=""
          className="absolute w-64 h-40 md:w-80 md:h-52 object-contain"
          style={{
            opacity: digits.some(d => d !== "") && status !== "success" ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
            mixBlendMode: "lighten",
            top: "8%",
            zIndex: 1,
          }}
        />
        <img
          src={skeletonGif}
          alt=""
          className="w-64 h-64 md:w-80 md:h-80 object-contain"
          style={{
            opacity: digits.some(d => d !== "") && status !== "success" ? 0.05 : 0.2,
            filter: "brightness(1.2) contrast(1.3)",
            animation: "skeletonFloat 4s ease-in-out infinite",
            transition: "opacity 0.5s ease-in-out",
          }}
        />
      </div>

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/3" />
        {status === "success" && (
          <>
            <div className="absolute inset-0 animate-successGlow" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute rounded-full border border-primary/20 animate-successRing"
                  style={{
                    width: 100 + i * 120,
                    height: 100 + i * 120,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-24 left-6 glass px-4 py-2 rounded-full flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-sans">Back</span>
      </button>

      <div className={`relative z-10 flex flex-col items-center w-full max-w-xs mx-auto px-4 ${shake ? 'animate-shake' : ''}`}>
        
        {/* Icon - only show on success */}
        {status === "success" && (
          <div className={`mb-6 transition-all duration-700 ease-out ${successPhase >= 2 ? "scale-0 opacity-0" : "scale-110"}`}>
            <div className="p-5 rounded-full bg-primary/15 border border-primary/30 animate-successPulse">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
        )}
        {status !== "success" && <div className="mb-6" />}

        {/* Title */}
        <h2 className={`font-display text-xl tracking-[0.15em] uppercase text-foreground mb-1 transition-all duration-500 ${successPhase >= 2 ? "opacity-0 -translate-y-4" : ""}`}>
          {status === "success" ? "Access Granted" : "Enter Passcode"}
        </h2>
        <p className={`text-muted-foreground text-xs mb-8 tracking-wider transition-all duration-500 ${successPhase >= 2 ? "opacity-0 -translate-y-4" : ""}`}>
          {status === "success"
            ? "Welcome back, agent."
            : status === "error"
            ? `Wrong code · Attempt ${attempts}`
            : "4-digit passcode required"}
        </p>

        {/* Dot indicators */}
        <div className={`flex gap-4 mb-10 transition-all duration-700 ${successPhase >= 2 ? "opacity-0 scale-75" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                status === "success"
                  ? "bg-primary scale-125 shadow-[0_0_16px_hsl(var(--primary)/0.7)]"
                  : status === "error"
                  ? "bg-destructive scale-95"
                  : digits[i] !== ""
                  ? "bg-foreground scale-105"
                  : "bg-muted-foreground/20 border border-muted-foreground/30"
              }`}
              style={{
                transitionDelay: status === "success" ? `${i * 120}ms` : "0ms",
              }}
            />
          ))}
        </div>

        {/* Big success overlay */}
        {successPhase >= 2 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-col items-center gap-5 animate-successBigReveal">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-successIconPop">
                  <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={1.5} />
                </div>
                {/* Glow behind icon */}
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 -z-10 scale-150" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-primary text-lg font-display tracking-[0.3em] uppercase font-bold">
                  Verified
                </span>
                <span className="text-muted-foreground text-xs tracking-widest">
                  Identity confirmed
                </span>
              </div>
              {/* Animated line */}
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-successLine" />
            </div>
          </div>
        )}

        {/* Keypad */}
        <div className={`grid grid-cols-3 gap-2.5 w-full transition-all duration-500 ${status === "success" ? "opacity-0 translate-y-8 pointer-events-none" : ""}`}>
          {keys.map((key, idx) => {
            if (key === "") return <div key={idx} />;
            return (
              <button
                key={key}
                onClick={() => key === "del" ? handleDelete() : handleDigit(key)}
                className={`h-14 rounded-xl text-base font-mono transition-all duration-150 active:scale-90 active:brightness-125 ${
                  key === "del"
                    ? "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    : "text-foreground hover:bg-primary/8 hover:text-primary"
                }`}
                style={{
                  background: key === "del" ? "transparent" : "hsl(var(--card) / 0.4)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid hsl(var(--border) / 0.3)",
                }}
              >
                {key === "del" ? "⌫" : key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom text */}
      <div className={`absolute bottom-8 text-center text-[10px] text-muted-foreground/20 tracking-widest uppercase transition-opacity duration-500 ${successPhase >= 2 ? "opacity-0" : ""}`}>
        <p>Secure Access Terminal</p>
      </div>

      <style>{`
        @keyframes successGlow {
          0% { background: transparent; }
          30% { background: radial-gradient(circle at center, hsl(var(--primary) / 0.12) 0%, transparent 60%); }
          100% { background: radial-gradient(circle at center, hsl(var(--primary) / 0.06) 0%, transparent 70%); }
        }
        .animate-successGlow { animation: successGlow 2s ease-out forwards; }
        
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.3); }
          50% { box-shadow: 0 0 30px 8px hsl(var(--primary) / 0.15); }
        }
        .animate-successPulse { animation: successPulse 1.2s ease-in-out infinite; }
        
        @keyframes successRing {
          0% { transform: scale(0.3); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-successRing { animation: successRing 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes successBigReveal {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-successBigReveal { animation: successBigReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes successIconPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-successIconPop { animation: successIconPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; animation-delay: 0.1s; transform: scale(0); }

        @keyframes successLine {
          0% { width: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { width: 4rem; opacity: 0.5; }
        }
        .animate-successLine { animation: successLine 0.8s ease-out forwards; animation-delay: 0.4s; width: 0; }

        @keyframes skeletonFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.03); }
        }
      `}</style>
    </section>
    </>
  );
};

export default PasswordLockPage;
