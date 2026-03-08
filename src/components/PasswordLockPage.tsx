import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ShieldCheck, ShieldX } from "lucide-react";

interface PasswordLockPageProps {
  onBack: () => void;
  onUnlock: () => void;
}

const correctPassword = "0001";

const PasswordLockPage = ({ onBack, onUnlock }: PasswordLockPageProps) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    if (status === "success") return;
    if (activeIndex >= 4) return;

    const newDigits = [...digits];
    newDigits[activeIndex] = digit;
    setDigits(newDigits);
    setStatus("idle");

    if (activeIndex === 3) {
      // All 4 digits entered, check
      const code = newDigits.join("");
      setTimeout(() => {
        if (code === correctPassword) {
          setStatus("success");
          setTimeout(onUnlock, 1800);
        } else {
          setStatus("error");
          setAttempts(prev => prev + 1);
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setDigits(["", "", "", ""]);
            setActiveIndex(0);
            setStatus("idle");
          }, 800);
        }
      }, 200);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  }, [digits, activeIndex, status, onUnlock]);

  const handleDelete = useCallback(() => {
    if (status === "success") return;
    if (activeIndex === 0 && digits[0] === "") return;
    const idx = digits[activeIndex] !== "" ? activeIndex : activeIndex - 1;
    if (idx < 0) return;
    const newDigits = [...digits];
    newDigits[idx] = "";
    setDigits(newDigits);
    setActiveIndex(idx);
    setStatus("idle");
  }, [digits, activeIndex, status]);

  // Keyboard support
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
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden page-transition bg-background">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/3" />
        {status === "success" && (
          <div className="absolute inset-0 animate-successGlow" />
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
        
        {/* Icon */}
        <div className={`mb-6 transition-all duration-700 ${status === "success" ? "scale-125" : ""}`}>
          {status === "success" ? (
            <div className="p-5 rounded-full bg-primary/15 border border-primary/30 animate-successPulse">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          ) : (
            <div className={`p-5 rounded-full glass border ${status === "error" ? "border-destructive/40" : "border-border/40"} transition-colors duration-300`}>
              <ShieldX className={`w-10 h-10 transition-colors duration-300 ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display text-xl tracking-[0.15em] uppercase text-foreground mb-1 transition-all duration-500">
          {status === "success" ? "Access Granted" : "Enter Passcode"}
        </h2>
        <p className="text-muted-foreground text-xs mb-8 tracking-wider">
          {status === "success"
            ? "Welcome back, agent."
            : status === "error"
            ? `Wrong code · Attempt ${attempts}`
            : "4-digit passcode required"}
        </p>

        {/* Dot indicators */}
        <div className="flex gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                status === "success"
                  ? "bg-primary scale-110 shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                  : status === "error"
                  ? "bg-destructive scale-95"
                  : digits[i] !== ""
                  ? "bg-foreground scale-105"
                  : "bg-muted-foreground/20 border border-muted-foreground/30"
              }`}
              style={{
                transitionDelay: status === "success" ? `${i * 100}ms` : "0ms",
              }}
            />
          ))}
        </div>

        {/* Success overlay */}
        {status === "success" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-col items-center gap-3 animate-successReveal">
              <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <span className="text-primary text-sm font-display tracking-[0.3em] uppercase">Verified</span>
            </div>
          </div>
        )}

        {/* Keypad */}
        {status !== "success" && (
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {keys.map((key, idx) => {
              if (key === "") return <div key={idx} />;
              return (
                <button
                  key={key}
                  onClick={() => key === "del" ? handleDelete() : handleDigit(key)}
                  className={`h-14 rounded-xl text-base font-mono transition-all duration-200 active:scale-90 ${
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
        )}
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-8 text-center text-[10px] text-muted-foreground/20 tracking-widest uppercase">
        <p>Secure Access Terminal</p>
      </div>

      <style>{`
        @keyframes successGlow {
          0% { background: transparent; }
          50% { background: radial-gradient(circle at center, hsl(var(--primary) / 0.08) 0%, transparent 70%); }
          100% { background: radial-gradient(circle at center, hsl(var(--primary) / 0.04) 0%, transparent 70%); }
        }
        .animate-successGlow { animation: successGlow 1.5s ease-out forwards; }
        
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.3); }
          50% { box-shadow: 0 0 30px 8px hsl(var(--primary) / 0.15); }
        }
        .animate-successPulse { animation: successPulse 1.5s ease-in-out infinite; }
        
        @keyframes successReveal {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-successReveal { animation: successReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.3s; opacity: 0; }
      `}</style>
    </section>
  );
};

export default PasswordLockPage;
