import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Lock, Unlock, Skull, PartyPopper } from "lucide-react";

interface PasswordLockPageProps {
  onBack: () => void;
  onUnlock: () => void;
}

const funnyFailMessages = [
  "Nice try, but that's as wrong as pineapple on pizza! 🍕",
  "Error 403: Brain not found 🧠",
  "Did you even try? My grandma could guess better 👵",
  "That password is more broken than my sleep schedule 😴",
  "Incorrect! The universe laughs at your attempt 🌌",
  "Wrong! Even a potato would do better 🥔",
  "Nope! Try 'password123'... just kidding, don't 🙃",
  "Access Denied: Have you tried turning your brain on and off? 🔌",
];

const funnyHints = [
  "Hint: It's the meaning of life, the universe, and everything 🌌",
  "Hint: What do you get when you multiply 6 by 9 in base 13? 🤓",
  "Hint: Douglas Adams knows the answer 📚",
  "Hint: How many roads must a man walk down? 🛤️",
  "Hint: It's between 41 and 43... inclusive-ish 🎯",
];

const PasswordLockPage = ({ onBack, onUnlock }: PasswordLockPageProps) => {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [hint, setHint] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const correctPassword = "0001";

  useEffect(() => {
    setHint(funnyHints[Math.floor(Math.random() * funnyHints.length)]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (password === correctPassword) {
      setIsUnlocked(true);
      setShowCelebration(true);
      setTimeout(() => {
        onUnlock();
      }, 2000);
    } else {
      setAttempts(prev => prev + 1);
      setShake(true);
      setFailMessage(funnyFailMessages[Math.floor(Math.random() * funnyFailMessages.length)]);
      setPassword("");
      setTimeout(() => setShake(false), 500);
      
      // Change hint after fails
      if (attempts >= 2) {
        setHint(funnyHints[Math.floor(Math.random() * funnyHints.length)]);
      }
    }
  }, [password, attempts, onUnlock]);

  const handleKeyPress = (key: string) => {
    if (isUnlocked) return;
    
    if (key === "clear") {
      setPassword("");
    } else if (key === "enter") {
      handleSubmit();
    } else if (password.length < 10) {
      setPassword(prev => prev + key);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden page-transition bg-background">
      {/* Cinematic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-24 left-6 glass px-4 py-2 rounded-full flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-500 hover:scale-105 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      {/* Main lock container */}
      <div className={`relative z-10 max-w-sm w-full mx-6 ${shake ? 'animate-shake' : ''}`}>
        {/* Lock icon */}
        <div className="flex justify-center mb-8">
          <div className={`p-6 rounded-full glass glow-border transition-all duration-700 ${isUnlocked ? 'bg-primary/20 scale-110' : ''}`}>
            {isUnlocked ? (
              <Unlock className="w-12 h-12 text-primary animate-pulse" />
            ) : (
              <Lock className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl md:text-3xl text-center mb-2 text-foreground">
          {isUnlocked ? "ACCESS GRANTED" : "ENTER PASSCODE"}
        </h2>
        
        {/* Subtitle/Hint */}
        <p className="text-center text-muted-foreground text-sm mb-8 px-4">
          {isUnlocked ? "Welcome, chosen one! 🎉" : hint}
        </p>

        {/* Password display */}
        <div className="glass rounded-2xl p-4 mb-6 glow-border">
          <div className="flex justify-center gap-2 h-12 items-center">
            {password.split("").map((char, i) => (
              <div 
                key={i}
                className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-mono text-lg fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {char}
              </div>
            ))}
            {password.length === 0 && (
              <span className="text-muted-foreground/50 text-sm">Enter the sacred numbers...</span>
            )}
          </div>
        </div>

        {/* Fail message */}
        {failMessage && !isUnlocked && (
          <div className="text-center mb-4 fade-in-up">
            <p className="text-destructive text-sm flex items-center justify-center gap-2">
              <Skull className="w-4 h-4" />
              {failMessage}
            </p>
            <p className="text-muted-foreground text-xs mt-1">Attempts: {attempts}</p>
          </div>
        )}

        {/* Keypad */}
        {!isUnlocked && (
          <div className="grid grid-cols-3 gap-3">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`h-14 rounded-xl glass text-lg font-mono transition-all duration-300 hover:scale-105 active:scale-95 ${
                  key === "enter" 
                    ? "bg-primary/20 text-primary hover:bg-primary/30" 
                    : key === "clear"
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-primary/10 hover:text-primary"
                }`}
                style={{
                  boxShadow: '0 4px 20px hsl(var(--background) / 0.5)',
                }}
              >
                {key === "clear" ? "CLR" : key === "enter" ? "→" : key}
              </button>
            ))}
          </div>
        )}

        {/* Celebration */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-4 animate-bounce">
              <PartyPopper className="w-8 h-8 text-primary" />
              <PartyPopper className="w-8 h-8 text-primary rotate-90" />
              <PartyPopper className="w-8 h-8 text-primary -rotate-90" />
            </div>
          </div>
        )}
      </div>

      {/* Easter egg at bottom */}
      <div className="absolute bottom-8 text-center text-xs text-muted-foreground/30 fade-in-up delay-700">
        <p>🔒 Security Level: Maximum Overkill 🔒</p>
      </div>
    </section>
  );
};

export default PasswordLockPage;
