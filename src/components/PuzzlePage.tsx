import { useState, useEffect, useRef, useCallback } from "react";

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  type: "cactus" | "banana" | "coffee" | "bug" | "skull" | "fire" | "poop";
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  type: "coin" | "star" | "heart";
  collected: boolean;
}

const funnyMessages = [
  "Why did you hit that? It was clearly visible... from space! 🛸",
  "My grandma jumps better than this! 👵",
  "Have you tried turning yourself off and on again? 🔌",
  "That obstacle had a family! 😭",
  "Dino tried its best. Dino failed. Dino extinct again! 💀",
  "Error 404: Gaming skills not found 🎮",
  "That's not how extinction works... or is it? 🤔",
  "Achievement unlocked: Professional Obstacle Hugger! 🏆",
  "You call that jumping? My pet rock jumps higher! 🪨",
  "Plot twist: The obstacle was the hero all along! 🦸",
  "Breaking News: Local dino discovers gravity! 📺",
  "Skill issue detected. Have you tried git gud? 💻",
];

const weirdFacts = [
  "Fun fact: Bananas are berries, but strawberries aren't! 🍌",
  "A group of flamingos is called a 'flamboyance' 🦩",
  "Honey never spoils. 3000-year-old honey is still edible! 🍯",
  "Octopuses have 3 hearts and blue blood 🐙",
  "Cows have best friends and get stressed when separated 🐄",
  "The inventor of the Pringles can is buried in one ⚰️",
  "A jiffy is an actual unit of time: 1/100th of a second ⏱️",
  "Nintendo was founded in 1889 as a playing card company 🎴",
  "NSFW: Not Safe For Wombats. They poop cubes. 💩",
  "The first computer bug was an actual bug 🪲",
];

const illegalTips = [
  "Pro tip: You can't lose if you don't play! *taps forehead* 🧠",
  "Cheat code: ↑↑↓↓←→←→BA... just kidding, jump! 🎮",
  "Secret: The dino has trust issues from past extinctions 🦖",
  "Easter egg: There are no easter eggs. Or are there? 🥚",
  "Warning: This game may cause sudden urges to jump IRL 🦘",
];

const PuzzlePage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [funnyMessage, setFunnyMessage] = useState("");
  const [weirdFact, setWeirdFact] = useState(weirdFacts[0]);
  const [illegalTip, setIllegalTip] = useState(illegalTips[0]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(8);
  const [doubleJumpAvailable, setDoubleJumpAvailable] = useState(true);
  const [isDucking, setIsDucking] = useState(false);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const collectibleIdRef = useRef(0);
  const velocityRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const jumpCountRef = useRef(0);

  const GRAVITY = 1.0;
  const JUMP_FORCE = -16;
  const GROUND_Y = 0;
  const DINO_SIZE = 40;
  const OBSTACLE_GAP = 300;

  // Sound effects
  const playSound = useCallback((type: "jump" | "hit" | "score" | "collect" | "combo") => {
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
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      } else if (type === "hit") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
      } else if (type === "score") {
        oscillator.frequency.setValueAtTime(500, ctx.currentTime);
        oscillator.frequency.setValueAtTime(700, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      } else if (type === "collect") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      } else if (type === "combo") {
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.setValueAtTime(900, ctx.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.log("Audio not available");
    }
  }, [audioEnabled]);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver || isDucking) return;
    
    if (!isJumping) {
      setIsJumping(true);
      jumpCountRef.current = 1;
      velocityRef.current = JUMP_FORCE;
      setDoubleJumpAvailable(true);
      playSound("jump");
    } else if (doubleJumpAvailable && jumpCountRef.current < 2) {
      // Double jump
      jumpCountRef.current = 2;
      velocityRef.current = JUMP_FORCE * 0.85;
      setDoubleJumpAvailable(false);
      playSound("jump");
    }
  }, [isJumping, isPlaying, gameOver, doubleJumpAvailable, isDucking, playSound]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setYPosition(0);
    setIsJumping(false);
    setObstacles([]);
    setCollectibles([]);
    setCombo(0);
    setGameSpeed(8);
    setDoubleJumpAvailable(true);
    velocityRef.current = 0;
    obstacleIdRef.current = 0;
    collectibleIdRef.current = 0;
    jumpCountRef.current = 0;
    setWeirdFact(weirdFacts[Math.floor(Math.random() * weirdFacts.length)]);
    setIllegalTip(illegalTips[Math.floor(Math.random() * illegalTips.length)]);
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
      if (e.code === "ArrowDown" && isPlaying && !gameOver) {
        setIsDucking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        setIsDucking(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump, isPlaying, gameOver]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let lastScoreSound = 0;
    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;
      
      // Increase speed over time
      if (frameCount % 500 === 0) {
        setGameSpeed(prev => Math.min(prev + 0.5, 15));
      }

      // Apply gravity (faster when ducking)
      const gravityMultiplier = isDucking ? 2.5 : 1;
      velocityRef.current += GRAVITY * gravityMultiplier;
      
      setYPosition(prev => {
        const newY = prev + velocityRef.current;
        if (newY >= GROUND_Y) {
          velocityRef.current = 0;
          setIsJumping(false);
          jumpCountRef.current = 0;
          setDoubleJumpAvailable(true);
          return GROUND_Y;
        }
        return newY;
      });

      // Move obstacles and spawn new ones
      setObstacles(prev => {
        let newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameSpeed }))
          .filter(obs => obs.x > -100);

        // Spawn new obstacle
        if (newObstacles.length === 0 || 
            (newObstacles.length > 0 && newObstacles[newObstacles.length - 1].x < window.innerWidth - OBSTACLE_GAP)) {
          const height = 30 + Math.random() * 30;
          const types: Array<Obstacle["type"]> = ["cactus", "banana", "coffee", "bug", "skull", "fire", "poop"];
          newObstacles.push({
            id: obstacleIdRef.current++,
            x: window.innerWidth + Math.random() * 100,
            width: 25,
            height,
            type: types[Math.floor(Math.random() * types.length)],
          });
        }

        return newObstacles;
      });

      // Move collectibles
      setCollectibles(prev => {
        let newCollectibles = prev
          .map(c => ({ ...c, x: c.x - gameSpeed }))
          .filter(c => c.x > -50 && !c.collected);

        // Spawn collectible occasionally
        if (Math.random() < 0.01 && (newCollectibles.length === 0 || newCollectibles[newCollectibles.length - 1]?.x < window.innerWidth - 200)) {
          const types: Array<Collectible["type"]> = ["coin", "star", "heart"];
          newCollectibles.push({
            id: collectibleIdRef.current++,
            x: window.innerWidth,
            y: 60 + Math.random() * 80,
            type: types[Math.floor(Math.random() * types.length)],
            collected: false,
          });
        }

        return newCollectibles;
      });

      // Check collisions
      setYPosition(currentY => {
        const dinoHeight = isDucking ? DINO_SIZE * 0.5 : DINO_SIZE;
        const dinoBottom = 150 + currentY;
        const dinoTop = dinoBottom - dinoHeight;
        const dinoLeft = 60;
        const dinoRight = dinoLeft + DINO_SIZE * 0.8;

        // Check obstacle collision
        setObstacles(currentObs => {
          for (const obs of currentObs) {
            const obsLeft = obs.x;
            const obsRight = obs.x + obs.width;
            const obsTop = 150 - obs.height;
            
            if (dinoRight > obsLeft && dinoLeft < obsRight && dinoBottom > obsTop) {
              setGameOver(true);
              setIsPlaying(false);
              setHighScore(prev => Math.max(prev, score));
              setFunnyMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
              playSound("hit");
              break;
            }
          }
          return currentObs;
        });

        // Check collectible collision
        setCollectibles(currentColl => {
          return currentColl.map(c => {
            if (c.collected) return c;
            
            const collLeft = c.x;
            const collRight = c.x + 25;
            const collTop = 150 - c.y;
            const collBottom = collTop + 25;
            
            if (dinoRight > collLeft && dinoLeft < collRight && 
                dinoBottom > collTop && dinoTop < collBottom) {
              playSound("collect");
              setCombo(prev => {
                const newCombo = prev + 1;
                if (newCombo >= 3) {
                  setShowCombo(true);
                  playSound("combo");
                  setTimeout(() => setShowCombo(false), 1000);
                }
                return newCombo;
              });
              setScore(prev => prev + (c.type === "star" ? 50 : c.type === "heart" ? 30 : 20));
              return { ...c, collected: true };
            }
            return c;
          });
        });

        return currentY;
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
  }, [isPlaying, gameOver, gameSpeed, isDucking, score, playSound]);

  const getObstacleEmoji = (type: Obstacle["type"]) => {
    switch (type) {
      case "banana": return "🍌";
      case "coffee": return "☕";
      case "bug": return "🐛";
      case "skull": return "💀";
      case "fire": return "🔥";
      case "poop": return "💩";
      default: return "🌵";
    }
  };

  const getCollectibleEmoji = (type: Collectible["type"]) => {
    switch (type) {
      case "star": return "⭐";
      case "heart": return "❤️";
      default: return "🪙";
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      
      {/* Floating weird elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-4xl opacity-20 float-animation">🦕</div>
        <div className="absolute top-40 right-20 text-3xl opacity-15 float-animation delay-200">🌋</div>
        <div className="absolute bottom-40 left-20 text-2xl opacity-10 float-animation delay-400">🥚</div>
        <div className="absolute top-60 left-1/3 text-2xl opacity-10 bounce-animation">☄️</div>
      </div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-6 stagger-children">
          <h2 className="font-display text-2xl md:text-4xl font-bold glow-text mb-2">
            Dino-<span className="gradient-text">Runner</span> 🦖
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            SPACE/TAP = Jump • Double tap = Double jump • DOWN = Duck
          </p>
          {/* Weird fact ticker */}
          <p className="text-primary/60 text-xs mt-2 italic glow-pulse">
            {weirdFact}
          </p>
          <p className="text-muted-foreground/50 text-xs mt-1">
            {illegalTip}
          </p>
        </div>

        {/* Score display */}
        <div className="flex justify-between items-center mb-4 text-xs md:text-sm fade-in-up">
          <div className="glass px-3 md:px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Score: </span>
            <span className="text-primary font-bold">{Math.floor(score / 10)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="glass px-3 py-2 rounded-lg text-muted-foreground hover:text-primary transition-colors hover:scale-110"
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            {showCombo && (
              <div className="glass px-3 py-2 rounded-lg text-primary font-bold animate-pulse">
                🔥 COMBO x{combo}!
              </div>
            )}
          </div>
          <div className="glass px-3 md:px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Best: </span>
            <span className="text-primary font-bold">{Math.floor(highScore / 10)}</span>
          </div>
        </div>

        {/* Game area */}
        <div
          ref={gameRef}
          className="relative w-full h-56 md:h-64 glass rounded-2xl overflow-hidden cursor-pointer border border-primary/20 glow-border zoom-in"
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
            <div className="flex gap-4 animate-scroll" style={{ animationDuration: `${3 / (gameSpeed / 8)}s` }}>
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="w-8 h-0.5 bg-primary/20 rounded-full flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Speed indicator */}
          {isPlaying && !gameOver && (
            <div className="absolute top-2 left-2 text-xs text-primary/40">
              Speed: {gameSpeed.toFixed(1)}x
            </div>
          )}

          {/* Dino Character */}
          <div
            className={`absolute transition-all duration-75 ${isJumping ? 'dino-jump' : isPlaying && !gameOver ? 'dino-run' : ''}`}
            style={{
              left: 60,
              bottom: 32 - yPosition,
              transform: `scaleY(${isDucking ? 0.5 : 1})`,
            }}
          >
            <div className="relative">
              {/* Tiny Dino SVG */}
              <svg
                width={DINO_SIZE}
                height={isDucking ? DINO_SIZE * 0.5 : DINO_SIZE}
                viewBox="0 0 40 40"
                className="drop-shadow-[0_0_10px_hsl(var(--primary))]"
                style={{
                  filter: `drop-shadow(0 0 15px hsl(var(--primary)))`,
                }}
              >
                {/* Dino body */}
                <ellipse cx="20" cy="25" rx="12" ry="10" fill="hsl(var(--primary))" />
                {/* Dino head */}
                <circle cx="28" cy="15" r="8" fill="hsl(var(--primary))" />
                {/* Eye */}
                <circle cx="31" cy="13" r="2" fill="hsl(var(--background))" />
                <circle cx="32" cy="12" r="1" fill="hsl(var(--primary))" />
                {/* Mouth */}
                <path d="M 33 17 Q 36 18 33 20" stroke="hsl(var(--background))" strokeWidth="1" fill="none" />
                {/* Legs */}
                {!isDucking && (
                  <>
                    <rect x="14" y="32" width="4" height="8" rx="2" fill="hsl(var(--primary))" className={isPlaying && !gameOver && !isJumping ? "animate-[wiggle_0.15s_ease-in-out_infinite]" : ""} />
                    <rect x="22" y="32" width="4" height="8" rx="2" fill="hsl(var(--primary))" className={isPlaying && !gameOver && !isJumping ? "animate-[wiggle_0.15s_ease-in-out_infinite_0.075s]" : ""} />
                  </>
                )}
                {/* Tail */}
                <path d="M 8 25 Q 2 20 5 28" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
                {/* Spikes */}
                <path d="M 15 15 L 17 10 L 19 15 L 21 10 L 23 15" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
              </svg>
              
              {/* Running particles */}
              {isPlaying && !gameOver && !isJumping && (
                <div className="absolute -bottom-1 -left-4">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-2 bg-primary/50 rounded-full animate-ping" />
                    <div className="w-1 h-3 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: "50ms" }} />
                    <div className="w-1 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: "100ms" }} />
                  </div>
                </div>
              )}
              
              {/* Double jump indicator */}
              {doubleJumpAvailable && isJumping && jumpCountRef.current === 1 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-primary animate-pulse">
                  ⬆️
                </div>
              )}
            </div>
          </div>

          {/* Obstacles */}
          {obstacles.map(obs => (
            <div
              key={obs.id}
              className="absolute bottom-8 text-2xl md:text-3xl transition-transform wiggle-animation"
              style={{
                left: obs.x,
                animationDuration: "0.3s",
              }}
            >
              {getObstacleEmoji(obs.type)}
            </div>
          ))}

          {/* Collectibles */}
          {collectibles.filter(c => !c.collected).map(c => (
            <div
              key={c.id}
              className="absolute text-xl md:text-2xl bounce-animation"
              style={{
                left: c.x,
                bottom: c.y,
              }}
            >
              {getCollectibleEmoji(c.type)}
            </div>
          ))}

          {/* Start / Game Over overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-md">
              <div className="text-center px-4 zoom-in">
                {gameOver ? (
                  <>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-destructive mb-2 wiggle-animation">
                      💥 Extinction Event! 💥
                    </h3>
                    <p className="text-muted-foreground mb-2 text-sm">
                      Score: <span className="text-primary font-bold">{Math.floor(score / 10)}</span>
                      {combo > 0 && <span className="ml-2 text-primary/60">Combo: x{combo}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground italic mb-4 max-w-xs mx-auto">
                      {funnyMessage}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4 bounce-animation">🦖</div>
                    <h3 className="font-display text-xl md:text-2xl font-bold glow-text mb-2">Ready to Run?</h3>
                    <p className="text-xs text-muted-foreground mb-2">Help the tiny dino avoid extinction... again!</p>
                    <p className="text-xs text-primary/60 mb-2">🔥 Collect stars & coins for bonus points!</p>
                    <p className="text-xs text-muted-foreground/60 mb-2">⬇️ Press DOWN to duck under flying obstacles!</p>
                  </>
                )}
                <p className="text-primary text-xs md:text-sm glow-pulse">
                  {gameOver ? "Tap or SPACE to try again! 🔄" : "Tap or SPACE to start! 🚀"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="text-center mt-4 text-muted-foreground text-xs stagger-children">
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="glass px-3 py-1 rounded-full hover:scale-105 transition-transform">SPACE</span>
            <span className="text-muted-foreground/50">or</span>
            <span className="glass px-3 py-1 rounded-full hover:scale-105 transition-transform">TAP</span>
            <span className="text-muted-foreground/50">=</span>
            <span className="text-primary">Jump</span>
            <span className="mx-2 text-muted-foreground/30">|</span>
            <span className="glass px-3 py-1 rounded-full hover:scale-105 transition-transform">↓</span>
            <span className="text-muted-foreground/50">=</span>
            <span className="text-primary">Duck</span>
          </div>
          <p className="mt-2 text-muted-foreground/40 text-xs italic">
            Pro tip: Double tap for double jump! 🦘
          </p>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
