import { useState, useEffect, useRef, useCallback } from "react";

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  type: "cactus" | "banana" | "coffee" | "bug";
}

const funnyMessages = [
  "Why did you hit that? It was clearly visible... from space! 🛸",
  "My grandma jumps better than this! 👵",
  "Have you tried turning yourself off and on again? 🔌",
  "That obstacle had a family! 😭",
  "Y tried its best. Y failed. Y will try again! 💪",
  "Error 404: Gaming skills not found 🎮",
  "That's not how gravity works... or is it? 🤔",
  "Achievement unlocked: Professional Obstacle Hugger! 🏆",
];

const weirdFacts = [
  "Fun fact: Bananas are berries, but strawberries aren't! 🍌",
  "A group of flamingos is called a 'flamboyance' 🦩",
  "Honey never spoils. 3000-year-old honey is still edible! 🍯",
  "Octopuses have 3 hearts and blue blood 🐙",
  "You can hear a blue whale's heartbeat from 2 miles away 🐋",
];

const PuzzlePage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [funnyMessage, setFunnyMessage] = useState("");
  const [weirdFact, setWeirdFact] = useState(weirdFacts[0]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const velocityRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const GRAVITY = 1.2;
  const JUMP_FORCE = -18;
  const GAME_SPEED = 8;
  const GROUND_Y = 0;
  const Y_SIZE = 50;
  const OBSTACLE_GAP = 350;

  // Sound effects
  const playSound = useCallback((type: "jump" | "hit" | "score") => {
    if (!audioEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === "jump") {
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      } else if (type === "hit") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } else if (type === "score") {
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.log("Audio not available");
    }
  }, [audioEnabled]);

  const jump = useCallback(() => {
    if (!isJumping && isPlaying && !gameOver) {
      setIsJumping(true);
      velocityRef.current = JUMP_FORCE;
      playSound("jump");
    }
  }, [isJumping, isPlaying, gameOver, playSound]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setYPosition(0);
    setIsJumping(false);
    setObstacles([]);
    velocityRef.current = 0;
    obstacleIdRef.current = 0;
    setWeirdFact(weirdFacts[Math.floor(Math.random() * weirdFacts.length)]);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else if (gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump, isPlaying, gameOver]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let lastScoreSound = 0;

    const gameLoop = () => {
      // Apply gravity
      velocityRef.current += GRAVITY;
      setYPosition(prev => {
        const newY = prev + velocityRef.current;
        if (newY >= GROUND_Y) {
          velocityRef.current = 0;
          setIsJumping(false);
          return GROUND_Y;
        }
        return newY;
      });

      // Move obstacles and spawn new ones
      setObstacles(prev => {
        let newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - GAME_SPEED }))
          .filter(obs => obs.x > -100);

        // Spawn new obstacle
        if (newObstacles.length === 0 || 
            (newObstacles.length > 0 && newObstacles[newObstacles.length - 1].x < window.innerWidth - OBSTACLE_GAP)) {
          const height = 35 + Math.random() * 25;
          const types: Array<"cactus" | "banana" | "coffee" | "bug"> = ["cactus", "banana", "coffee", "bug"];
          newObstacles.push({
            id: obstacleIdRef.current++,
            x: window.innerWidth,
            width: 25,
            height,
            type: types[Math.floor(Math.random() * types.length)],
          });
        }

        // Check collision
        setYPosition(currentY => {
          const yBottom = 150 + currentY;
          newObstacles.forEach(obs => {
            const yLeft = 60;
            const yRight = yLeft + Y_SIZE;
            const obsLeft = obs.x;
            const obsRight = obs.x + obs.width;
            
            if (yRight > obsLeft && yLeft < obsRight && yBottom > 150 - obs.height) {
              setGameOver(true);
              setIsPlaying(false);
              setHighScore(prev => Math.max(prev, score));
              setFunnyMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
              playSound("hit");
            }
          });
          return currentY;
        });

        return newObstacles;
      });

      // Update score
      setScore(prev => {
        const newScore = prev + 1;
        if (Math.floor(newScore / 100) > lastScoreSound) {
          lastScoreSound = Math.floor(newScore / 100);
          playSound("score");
        }
        return newScore;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameOver, score, playSound]);

  const getObstacleEmoji = (type: string) => {
    switch (type) {
      case "banana": return "🍌";
      case "coffee": return "☕";
      case "bug": return "🐛";
      default: return "🌵";
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl md:text-4xl font-bold glow-text mb-2">
            Y-<span className="gradient-text">Runner</span>
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Press SPACE or TAP to jump • Avoid weird stuff
          </p>
          {/* Weird fact ticker */}
          <p className="text-primary/60 text-xs mt-2 italic animate-pulse">
            {weirdFact}
          </p>
        </div>

        {/* Score display */}
        <div className="flex justify-between items-center mb-4 text-xs md:text-sm">
          <div className="glass px-3 md:px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Score: </span>
            <span className="text-primary font-bold">{Math.floor(score / 10)}</span>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="glass px-3 py-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
          >
            {audioEnabled ? "🔊" : "🔇"}
          </button>
          <div className="glass px-3 md:px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Best: </span>
            <span className="text-primary font-bold">{Math.floor(highScore / 10)}</span>
          </div>
        </div>

        {/* Game area */}
        <div
          ref={gameRef}
          className="relative w-full h-56 md:h-64 glass rounded-2xl overflow-hidden cursor-pointer border border-primary/20"
          onClick={() => {
            if (!isPlaying && !gameOver) {
              startGame();
            } else if (gameOver) {
              startGame();
            } else {
              jump();
            }
          }}
        >
          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-primary/20 to-transparent border-t border-primary/30" />
          
          {/* Running ground animation */}
          <div className="absolute bottom-2 left-0 right-0 flex overflow-hidden">
            <div className="flex gap-4 animate-scroll">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-8 h-0.5 bg-primary/20 rounded-full flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Y Character */}
          <div
            className="absolute transition-transform duration-75"
            style={{
              left: 60,
              bottom: 32 - yPosition,
              transform: `rotate(${isJumping ? -15 : 0}deg) scale(${isJumping ? 1.1 : 1})`,
            }}
          >
            <div className="relative">
              <span 
                className="font-display text-5xl md:text-6xl font-black text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]"
                style={{
                  textShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)",
                }}
              >
                Y
              </span>
              {/* Running particles */}
              {isPlaying && !gameOver && !isJumping && (
                <div className="absolute -bottom-1 -left-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-2 bg-primary/40 rounded-full animate-ping" />
                    <div className="w-1 h-3 bg-primary/30 rounded-full animate-ping delay-75" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Obstacles */}
          {obstacles.map(obs => (
            <div
              key={obs.id}
              className="absolute bottom-8 text-2xl md:text-3xl transition-transform"
              style={{
                left: obs.x,
              }}
            >
              {getObstacleEmoji(obs.type)}
            </div>
          ))}

          {/* Start / Game Over overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="text-center px-4">
                {gameOver ? (
                  <>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-destructive mb-2">Game Over!</h3>
                    <p className="text-muted-foreground mb-2 text-sm">
                      Score: <span className="text-primary font-bold">{Math.floor(score / 10)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground italic mb-4 max-w-xs mx-auto">
                      {funnyMessage}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-xl md:text-2xl font-bold glow-text mb-2">Ready?</h3>
                    <p className="text-xs text-muted-foreground mb-2">Help Y avoid the weird stuff!</p>
                  </>
                )}
                <p className="text-primary text-xs md:text-sm animate-pulse">
                  {gameOver ? "Tap or SPACE to retry" : "Tap or SPACE to start"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="text-center mt-4 text-muted-foreground text-xs">
          <span className="glass px-3 py-1 rounded-full">SPACE</span>
          <span className="mx-2">or</span>
          <span className="glass px-3 py-1 rounded-full">TAP</span>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
