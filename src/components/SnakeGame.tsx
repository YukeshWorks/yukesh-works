import { useState, useEffect, useRef, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface SnakeSegment extends Point {
  targetX: number;
  targetY: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 16;
const GAME_WIDTH = 320;
const GAME_HEIGHT = 320;

const SAVAGE_MESSAGES = [
  "Bro really thought he was a snake charmer 🐍💀",
  "Even a worm has better reflexes than you 🪱",
  "Your snake died of embarrassment, not collision 😭",
  "That wall was literally standing still... and you LOST? 🧱",
  "Uninstall your fingers 🖐️🗑️",
  "My grandma plays better... and she's a plant 🌱",
  "You lasted shorter than my phone battery at 1% 🔋",
  "The food was RIGHT THERE. Right. There. 🍎",
  "Skill issue doesn't even begin to cover this 📉",
  "POV: you thought 'up' meant 'into the wall' 🤡",
  "The snake is filing a complaint against you 📝",
  "Are you playing with your elbows? Be honest 💀",
  "Achievement unlocked: Speedrun to Game Over! 🏆",
  "Your reaction time is measured in geological eras 🦕",
  "Even AI bots feel sorry watching you play 🤖",
  "404: Skill not found 🚫",
  "That wasn't gaming, that was a cry for help 😩",
  "Bro's playing snake like it's a horror game - scared of everything 👻",
  "You just set the world record... for fastest failure 🥇",
  "The snake wanted to live, but YOU had other plans 💔",
];

const LOW_SCORE_ROASTS = [
  "Score: {score}. That's not a score, that's a cry for help 😭",
  "Score: {score}. My calculator shows more digits by accident 🧮",
  "Score: {score}. Even a broken clock is right twice a day. You're never right 🕐",
];

const MID_SCORE_ROASTS = [
  "Score: {score}. Almost impressive... almost 🤏",
  "Score: {score}. Mediocrity has a new poster child 📸",
  "Score: {score}. You peaked and it wasn't high enough 📊",
];

const SnakeGame = () => {
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("right");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [savageMsg, setSavageMsg] = useState("");
  const [scoreRoast, setScoreRoast] = useState("");
  
  const gameRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(direction);
  const lastMoveRef = useRef(0);
  const touchStartRef = useRef<Point | null>(null);

  // Initialize snake
  const initGame = useCallback(() => {
    const initialSnake: SnakeSegment[] = [
      { x: 8, y: 10, targetX: 8, targetY: 10 },
      { x: 7, y: 10, targetX: 7, targetY: 10 },
      { x: 6, y: 10, targetX: 6, targetY: 10 },
    ];
    setSnake(initialSnake);
    setDirection("right");
    directionRef.current = "right";
    setScore(0);
    setGameOver(false);
    spawnFood(initialSnake);
    setIsPlaying(true);
  }, []);

  // Spawn food at random position
  const spawnFood = (currentSnake: SnakeSegment[]) => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(s => s.x === newFood.x && s.y === newFood.y));
    setFood(newFood);
  };

  // Update direction ref
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying && !gameOver && (e.code === "Space" || e.code.startsWith("Arrow"))) {
        initGame();
        return;
      }
      
      if (gameOver && e.code === "Space") {
        initGame();
        return;
      }

      const now = Date.now();
      if (now - lastMoveRef.current < 50) return;
      lastMoveRef.current = now;

      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          if (directionRef.current !== "down") setDirection("up");
          break;
        case "ArrowDown":
        case "KeyS":
          if (directionRef.current !== "up") setDirection("down");
          break;
        case "ArrowLeft":
        case "KeyA":
          if (directionRef.current !== "right") setDirection("left");
          break;
        case "ArrowRight":
        case "KeyD":
          if (directionRef.current !== "left") setDirection("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, gameOver, initGame]);

  // Touch controls
  useEffect(() => {
    const gameEl = gameRef.current;
    if (!gameEl) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      
      if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
        if (!isPlaying || gameOver) initGame();
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && directionRef.current !== "left") setDirection("right");
        else if (deltaX < 0 && directionRef.current !== "right") setDirection("left");
      } else {
        if (deltaY > 0 && directionRef.current !== "up") setDirection("down");
        else if (deltaY < 0 && directionRef.current !== "down") setDirection("up");
      }
      
      touchStartRef.current = null;
    };

    gameEl.addEventListener("touchstart", handleTouchStart, { passive: true });
    gameEl.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      gameEl.removeEventListener("touchstart", handleTouchStart);
      gameEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPlaying, gameOver, initGame]);

  // Game loop with smooth interpolation
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameSpeed = Math.max(100, 150 - score * 2);
    
    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        let newHead: SnakeSegment;

        switch (directionRef.current) {
          case "up":
            newHead = { x: head.x, y: head.y - 1, targetX: head.x, targetY: head.y - 1 };
            break;
          case "down":
            newHead = { x: head.x, y: head.y + 1, targetX: head.x, targetY: head.y + 1 };
            break;
          case "left":
            newHead = { x: head.x - 1, y: head.y, targetX: head.x - 1, targetY: head.y };
            break;
          case "right":
            newHead = { x: head.x + 1, y: head.y, targetX: head.x + 1, targetY: head.y };
            break;
          default:
            newHead = head;
        }

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          setIsPlaying(false);
          setHighScore(prev => Math.max(prev, score));
          setSavageMsg(SAVAGE_MESSAGES[Math.floor(Math.random() * SAVAGE_MESSAGES.length)]);
          const roasts = score < 5 ? LOW_SCORE_ROASTS : MID_SCORE_ROASTS;
          setScoreRoast(roasts[Math.floor(Math.random() * roasts.length)].replace("{score}", String(score)));
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          setIsPlaying(false);
          setHighScore(prev => Math.max(prev, score));
          setSavageMsg(SAVAGE_MESSAGES[Math.floor(Math.random() * SAVAGE_MESSAGES.length)]);
          const roasts = score < 5 ? LOW_SCORE_ROASTS : MID_SCORE_ROASTS;
          setScoreRoast(roasts[Math.floor(Math.random() * roasts.length)].replace("{score}", String(score)));
          return prevSnake;
        }

        let newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prev => prev + 1);
          spawnFood(newSnake);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, gameSpeed);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, food, score]);

  // Get color for snake segment
  const getSegmentColor = (index: number, total: number) => {
    const hue = (185 + index * 3) % 360; // Shift hue along body
    const saturation = 70 - (index / total) * 20; // Fade saturation
    const lightness = 50 - (index / total) * 15; // Fade brightness
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Get segment size with subtle scaling
  const getSegmentScale = (index: number, total: number) => {
    if (index === 0) return 1.15; // Head slightly bigger
    return 1 - (index / total) * 0.2; // Tail gets smaller
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
      {/* Dark animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Floating ambient orbs */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl float-animation delay-300" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Title */}
        <div className="text-center mb-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            <span className="text-foreground">Snake</span>
            <span className="gradient-text ml-2">Game</span>
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            Arrow keys / Swipe to move • Space to start
          </p>
        </div>

        {/* Score */}
        <div className="flex gap-6 text-sm">
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Score: </span>
            <span className="text-primary font-bold">{score}</span>
          </div>
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Best: </span>
            <span className="text-primary font-bold">{highScore}</span>
          </div>
        </div>

        {/* Game board */}
        <div
          ref={gameRef}
          className="relative glass rounded-xl p-2 cursor-pointer glow-border"
          style={{ width: GAME_WIDTH + 16, height: GAME_HEIGHT + 16 }}
          onClick={() => {
            if (!isPlaying || gameOver) initGame();
          }}
        >
          <div 
            className="relative bg-background/80 rounded-lg overflow-hidden"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Game grid background */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
                `,
                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => {
              const scale = getSegmentScale(index, snake.length);
              const size = CELL_SIZE * scale;
              const offset = (CELL_SIZE - size) / 2;
              
              return (
                <div
                  key={index}
                  className="absolute rounded-full transition-all"
                  style={{
                    left: segment.x * CELL_SIZE + offset,
                    top: segment.y * CELL_SIZE + offset,
                    width: size,
                    height: size,
                    backgroundColor: getSegmentColor(index, snake.length),
                    boxShadow: index === 0 
                      ? `0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.5)` 
                      : `0 0 ${5 - index * 0.5}px hsl(var(--primary) / 0.3)`,
                    transform: `scale(${1 + Math.sin(Date.now() / 200 + index) * 0.05})`,
                    transition: 'left 0.1s ease-out, top 0.1s ease-out',
                  }}
                >
                  {/* Head eyes */}
                  {index === 0 && (
                    <>
                      <div 
                        className="absolute w-1.5 h-1.5 bg-background rounded-full"
                        style={{
                          top: '20%',
                          left: direction === "left" ? '15%' : direction === "right" ? '55%' : '25%',
                        }}
                      />
                      <div 
                        className="absolute w-1.5 h-1.5 bg-background rounded-full"
                        style={{
                          top: '20%',
                          right: direction === "right" ? '15%' : direction === "left" ? '55%' : '25%',
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}

            {/* Food with squash & stretch animation */}
            <div
              className="absolute rounded-full animate-food-pulse"
              style={{
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                background: `radial-gradient(circle at 30% 30%, hsl(0, 80%, 60%), hsl(0, 70%, 45%))`,
                boxShadow: '0 0 10px hsl(0, 80%, 50%), 0 0 20px hsl(0, 70%, 40% / 0.5)',
              }}
            />

            {/* Start / Game Over overlay */}
            {(!isPlaying || gameOver) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                {gameOver ? (
                  <>
                    <p className="font-display text-xl font-bold text-destructive animate-pulse">
                      💀 WASTED 💀
                    </p>
                    <p className="text-foreground text-xs text-center font-medium max-w-[260px]">
                      {savageMsg}
                    </p>
                    <p className="text-muted-foreground text-[10px] text-center italic max-w-[240px]">
                      {scoreRoast}
                    </p>
                    <p className="text-primary text-xs mt-1 animate-pulse">
                      Tap to embarrass yourself again 🔄
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-xl font-bold text-primary">
                      🐍 Tap to Start
                    </p>
                    <p className="text-muted-foreground/60 text-xs">
                      Press Space or Tap
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile controls hint */}
        <p className="text-muted-foreground/50 text-xs text-center md:hidden">
          Swipe in any direction to control
        </p>
      </div>
    </section>
  );
};

export default SnakeGame;
