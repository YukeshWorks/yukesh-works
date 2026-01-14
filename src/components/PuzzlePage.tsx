import { useState, useEffect, useRef, useCallback } from "react";

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
}

const PuzzlePage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const obstacleIdRef = useRef(0);

  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GAME_SPEED = 6;
  const GROUND_Y = 0;
  const Y_SIZE = 60;
  const OBSTACLE_GAP = 300;

  const jump = useCallback(() => {
    if (!isJumping && isPlaying && !gameOver) {
      setIsJumping(true);
      setYPosition(JUMP_FORCE * 8);
    }
  }, [isJumping, isPlaying, gameOver]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setYPosition(0);
    setIsJumping(false);
    setObstacles([]);
    obstacleIdRef.current = 0;
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
    setYPosition(0);
    setIsJumping(false);
    setObstacles([]);
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

    let velocity = 0;
    let currentY = yPosition;
    let lastObstacleX = window.innerWidth;

    const gameLoop = () => {
      // Apply gravity
      if (currentY < GROUND_Y || velocity !== 0) {
        velocity += GRAVITY;
        currentY += velocity;
        
        if (currentY >= GROUND_Y) {
          currentY = GROUND_Y;
          velocity = 0;
          setIsJumping(false);
        }
        setYPosition(currentY);
      }

      // Move obstacles and spawn new ones
      setObstacles(prev => {
        let newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - GAME_SPEED }))
          .filter(obs => obs.x > -100);

        // Spawn new obstacle
        if (newObstacles.length === 0 || 
            (newObstacles.length > 0 && newObstacles[newObstacles.length - 1].x < window.innerWidth - OBSTACLE_GAP)) {
          const height = 30 + Math.random() * 30;
          newObstacles.push({
            id: obstacleIdRef.current++,
            x: window.innerWidth,
            width: 20,
            height,
          });
        }

        // Check collision
        const yBottom = 150 - currentY;
        newObstacles.forEach(obs => {
          const yLeft = 50;
          const yRight = yLeft + Y_SIZE;
          const obsLeft = obs.x;
          const obsRight = obs.x + obs.width;
          
          if (yRight > obsLeft && yLeft < obsRight && yBottom < obs.height + 10) {
            setGameOver(true);
            setIsPlaying(false);
            setHighScore(prev => Math.max(prev, score));
          }
        });

        return newObstacles;
      });

      // Update score
      setScore(prev => prev + 1);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameOver, score]);

  // Handle jump state
  useEffect(() => {
    if (isJumping && yPosition >= GROUND_Y) {
      setYPosition(JUMP_FORCE * 8);
    }
  }, [isJumping]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold glow-text mb-2">
            Y-<span className="gradient-text">Runner</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Press SPACE or TAP to jump
          </p>
        </div>

        {/* Score display */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Score: </span>
            <span className="text-primary font-bold">{Math.floor(score / 10)}</span>
          </div>
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">High Score: </span>
            <span className="text-primary font-bold">{Math.floor(highScore / 10)}</span>
          </div>
        </div>

        {/* Game area */}
        <div
          ref={gameRef}
          className="relative w-full h-64 glass rounded-2xl overflow-hidden cursor-pointer border border-primary/20"
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
          
          {/* Ground details */}
          <div className="absolute bottom-2 left-0 right-0 flex gap-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-primary/30 rounded-full" style={{ marginLeft: `${i * 5}%` }} />
            ))}
          </div>

          {/* Y Character */}
          <div
            className="absolute transition-transform"
            style={{
              left: 50,
              bottom: 32 + yPosition,
              transform: isJumping ? "rotate(-10deg)" : "rotate(0deg)",
            }}
          >
            <div className="relative">
              <span 
                className="font-display text-6xl font-black text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]"
                style={{
                  textShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)",
                }}
              >
                Y
              </span>
              {/* Running animation effect */}
              {isPlaying && !gameOver && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-1">
                    <div className="w-1 h-2 bg-primary/50 rounded-full animate-pulse" />
                    <div className="w-1 h-3 bg-primary/30 rounded-full animate-pulse delay-75" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Obstacles (Cacti-like) */}
          {obstacles.map(obs => (
            <div
              key={obs.id}
              className="absolute bottom-8"
              style={{
                left: obs.x,
                width: obs.width,
                height: obs.height,
              }}
            >
              <div className="w-full h-full bg-gradient-to-t from-destructive/80 to-destructive/40 rounded-t-sm border border-destructive/50" />
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-destructive/60 rounded-full" />
            </div>
          ))}

          {/* Start / Game Over overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="text-center">
                {gameOver ? (
                  <>
                    <h3 className="font-display text-2xl font-bold text-destructive mb-2">Game Over!</h3>
                    <p className="text-muted-foreground mb-4">
                      Score: <span className="text-primary font-bold">{Math.floor(score / 10)}</span>
                    </p>
                  </>
                ) : (
                  <h3 className="font-display text-2xl font-bold glow-text mb-2">Ready?</h3>
                )}
                <p className="text-primary text-sm animate-pulse">
                  {gameOver ? "Tap or Press SPACE to retry" : "Tap or Press SPACE to start"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="text-center mt-6 text-muted-foreground text-xs">
          <span className="glass px-3 py-1 rounded-full">SPACE</span>
          <span className="mx-2">or</span>
          <span className="glass px-3 py-1 rounded-full">TAP</span>
          <span className="ml-2">to jump over obstacles</span>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
