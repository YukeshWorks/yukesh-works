import { useState, useEffect, useRef, useCallback } from "react";

interface Obstacle {
  id: number;
  lane: number;
  z: number;
  type: "barrier" | "car" | "cone" | "pizza" | "cactus" | "hole";
}

interface Collectible {
  id: number;
  lane: number;
  z: number;
  type: "coin" | "boost" | "star";
  collected: boolean;
}

interface RoadSegment {
  id: number;
  z: number;
}

const funnyMessages = [
  "Your bike just became modern art! 🎨",
  "That barrier had feelings, you know! 💔",
  "Your helmet protected nothing... especially your dignity! 🪖",
  "Achievement unlocked: Professional Crash Test Dummy! 🏆",
  "Breaking News: Local rider discovers physics! 📺",
  "Even the cone is disappointed in you! 🔶",
  "Your insurance company just unfriended you! 📱",
  "Skill issue? Nah, that's a skill CATASTROPHE! 🚨",
  "Bro thought this was a parking simulator 🅿️",
  "The obstacle didn't move. YOU moved INTO IT. 🤡",
  "My 3-year-old nephew wants his controller back 👶",
  "You ride bikes like you parallel park... terribly 🚗",
  "The road was literally straight. STRAIGHT. 📏",
  "Did you sneeze or are you always this bad? 🤧",
  "Somewhere, a driving instructor just felt a disturbance 👨‍🏫",
  "Your reaction time is buffering... still buffering... 🔄",
  "Alexa, show me what 0 hand-eye coordination looks like 🗣️",
  "That cone has a family, you monster 🔶😢",
  "You didn't crash. You aggressively parked. 🏎️",
];

const weirdFacts = [
  "Fun fact: The first motorcycle was steam-powered! 🏍️",
  "A group of bikers is called a 'rumble' 🏍️🏍️🏍️",
  "The longest bike ever was 31 meters! 📏",
  "Motorcycles existed before cars were popular 🏎️",
  "Some bikes can reach 400+ km/h! 💨",
  "The word 'biker' wasn't used until 1960s 📚",
];

const illegalTips = [
  "Pro tip: Obstacles can't hit you if you don't play! 🧠",
  "Cheat code: Be born with reflexes! 🎮",
  "Secret: The cones are sentient and hate you 🔶",
  "Easter egg: There's no easter egg. Or IS there? 🥚",
  "Warning: May cause sudden urges to buy a real bike 🏍️",
];

const PuzzlePage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerLane, setPlayerLane] = useState(1); // 0=left, 1=center, 2=right
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>([]);
  const [funnyMessage, setFunnyMessage] = useState("");
  const [weirdFact, setWeirdFact] = useState(weirdFacts[0]);
  const [illegalTip, setIllegalTip] = useState(illegalTips[0]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [bikeAngle, setBikeAngle] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const collectibleIdRef = useRef(0);
  const roadIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastLaneChangeRef = useRef(0);

  const LANES = [-60, 0, 60]; // Lane X positions

  // Sound effects
  const playSound = useCallback((type: "turn" | "crash" | "collect" | "boost") => {
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
      
      if (type === "turn") {
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
      } else if (type === "crash") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
      } else if (type === "collect") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      } else if (type === "boost") {
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(900, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.log("Audio not available");
    }
  }, [audioEnabled]);

  const moveLeft = useCallback(() => {
    if (!isPlaying || gameOver) return;
    const now = Date.now();
    if (now - lastLaneChangeRef.current < 150) return;
    lastLaneChangeRef.current = now;
    
    setPlayerLane(prev => {
      if (prev > 0) {
        setBikeAngle(-15);
        setIsMoving(true);
        setTimeout(() => {
          setBikeAngle(0);
          setIsMoving(false);
        }, 200);
        playSound("turn");
        return prev - 1;
      }
      return prev;
    });
  }, [isPlaying, gameOver, playSound]);

  const moveRight = useCallback(() => {
    if (!isPlaying || gameOver) return;
    const now = Date.now();
    if (now - lastLaneChangeRef.current < 150) return;
    lastLaneChangeRef.current = now;
    
    setPlayerLane(prev => {
      if (prev < 2) {
        setBikeAngle(15);
        setIsMoving(true);
        setTimeout(() => {
          setBikeAngle(0);
          setIsMoving(false);
        }, 200);
        playSound("turn");
        return prev + 1;
      }
      return prev;
    });
  }, [isPlaying, gameOver, playSound]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setPlayerLane(1);
    setObstacles([]);
    setCollectibles([]);
    setSpeed(3);
    setBikeAngle(0);
    obstacleIdRef.current = 0;
    collectibleIdRef.current = 0;
    
    // Initialize road segments
    const initialRoad: RoadSegment[] = [];
    for (let i = 0; i < 20; i++) {
      initialRoad.push({ id: roadIdRef.current++, z: i * 50 });
    }
    setRoadSegments(initialRoad);
    
    setWeirdFact(weirdFacts[Math.floor(Math.random() * weirdFacts.length)]);
    setIllegalTip(illegalTips[Math.floor(Math.random() * illegalTips.length)]);
  };

  // Handle keyboard/touch input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else {
          moveLeft();
        }
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else {
          moveRight();
        }
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlaying || gameOver) {
          startGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, isPlaying, gameOver]);

  // Touch controls
  const touchStartRef = useRef<number>(0);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientX - touchStartRef.current;
      if (Math.abs(diff) > 30) {
        if (diff > 0) moveRight();
        else moveLeft();
      } else if (!isPlaying || gameOver) {
        startGame();
      }
    };

    const gameEl = gameRef.current;
    if (gameEl) {
      gameEl.addEventListener("touchstart", handleTouchStart, { passive: true });
      gameEl.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
    
    return () => {
      if (gameEl) {
        gameEl.removeEventListener("touchstart", handleTouchStart);
        gameEl.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [moveLeft, moveRight, isPlaying, gameOver]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;
      
      // Increase speed over time
      if (frameCount % 300 === 0) {
        setSpeed(prev => Math.min(prev + 0.3, 8));
      }

      // Move road segments
      setRoadSegments(prev => {
        let newSegments = prev.map(seg => ({ ...seg, z: seg.z - speed }));
        newSegments = newSegments.filter(seg => seg.z > -100);
        
        const lastZ = newSegments.length > 0 ? Math.max(...newSegments.map(s => s.z)) : 0;
        while (newSegments.length < 20) {
          newSegments.push({ id: roadIdRef.current++, z: lastZ + 50 * (newSegments.length - prev.filter(s => s.z > -100).length + 1) });
        }
        
        return newSegments;
      });

      // Move obstacles
      setObstacles(prev => {
        let newObstacles = prev
          .map(obs => ({ ...obs, z: obs.z - speed }))
          .filter(obs => obs.z > -50);

        // Spawn new obstacle
        if (Math.random() < 0.02 && (newObstacles.length === 0 || Math.min(...newObstacles.map(o => o.z)) < 800)) {
          const types: Obstacle["type"][] = ["barrier", "car", "cone", "pizza", "cactus", "hole"];
          newObstacles.push({
            id: obstacleIdRef.current++,
            lane: Math.floor(Math.random() * 3),
            z: 1000 + Math.random() * 200,
            type: types[Math.floor(Math.random() * types.length)],
          });
        }

        return newObstacles;
      });

      // Move collectibles
      setCollectibles(prev => {
        let newCollectibles = prev
          .map(c => ({ ...c, z: c.z - speed }))
          .filter(c => c.z > -50 && !c.collected);

        // Spawn collectible
        if (Math.random() < 0.015 && (newCollectibles.length === 0 || Math.min(...newCollectibles.map(c => c.z)) < 700)) {
          const types: Collectible["type"][] = ["coin", "coin", "coin", "boost", "star"];
          newCollectibles.push({
            id: collectibleIdRef.current++,
            lane: Math.floor(Math.random() * 3),
            z: 900 + Math.random() * 200,
            type: types[Math.floor(Math.random() * types.length)],
            collected: false,
          });
        }

        return newCollectibles;
      });

      // Check collisions
      setObstacles(currentObs => {
        for (const obs of currentObs) {
          if (obs.lane === playerLane && obs.z > 20 && obs.z < 80) {
            setGameOver(true);
            setIsPlaying(false);
            setHighScore(prev => Math.max(prev, score));
            setFunnyMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
            playSound("crash");
            break;
          }
        }
        return currentObs;
      });

      // Check collectible collision
      setCollectibles(currentColl => {
        return currentColl.map(c => {
          if (c.collected) return c;
          
          if (c.lane === playerLane && c.z > 20 && c.z < 80) {
            playSound(c.type === "boost" ? "boost" : "collect");
            if (c.type === "boost") {
              setSpeed(prev => Math.min(prev + 1, 10));
            }
            setScore(prev => prev + (c.type === "star" ? 50 : c.type === "boost" ? 30 : 10));
            return { ...c, collected: true };
          }
          return c;
        });
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
  }, [isPlaying, gameOver, speed, playerLane, score, playSound]);

  const getObstacleEmoji = (type: Obstacle["type"]) => {
    switch (type) {
      case "car": return "🚗";
      case "cone": return "🔶";
      case "pizza": return "🍕";
      case "cactus": return "🌵";
      case "hole": return "🕳️";
      default: return "🚧";
    }
  };

  const getCollectibleEmoji = (type: Collectible["type"]) => {
    switch (type) {
      case "star": return "⭐";
      case "boost": return "🚀";
      default: return "🪙";
    }
  };

  // Calculate 3D perspective position
  const get3DPosition = (z: number, lane: number) => {
    const perspective = 300;
    const scale = perspective / (perspective + z);
    const x = LANES[lane] * scale;
    const y = 180 - (z * 0.15 * scale);
    return { x, y, scale };
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
      {/* Retro sunset gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff6b35] via-[#f7931e] to-[#4a0e4e]" />
      
      {/* Retro sun */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-b from-yellow-300 to-orange-500 blur-sm opacity-80" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-32 h-32 md:w-48 md:h-48">
        {/* Sun lines */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute left-1/2 w-full h-1 bg-gradient-to-r from-transparent via-black/20 to-transparent"
            style={{ 
              top: `${20 + i * 10}%`,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>
      
      {/* Grid floor effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent, #1a0a2e 40%)',
            transform: 'perspective(400px) rotateX(60deg)',
            transformOrigin: 'bottom',
          }}
        >
          {/* Horizontal grid lines */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute left-0 right-0 h-px bg-primary/30"
              style={{ bottom: `${i * 5}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-4 stagger-children">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
            Retro-<span className="text-yellow-300">Rider</span> 🏍️
          </h2>
          <p className="text-white/80 text-xs md:text-sm">
            ← → / Swipe = Steer • SPACE = Start
          </p>
          <p className="text-yellow-200/60 text-xs mt-1 italic">
            {weirdFact}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {illegalTip}
          </p>
        </div>

        {/* Score display */}
        <div className="flex justify-between items-center mb-4 text-xs md:text-sm">
          <div className="bg-black/50 backdrop-blur-sm px-3 md:px-4 py-2 rounded-lg border border-primary/30">
            <span className="text-white/70">Score: </span>
            <span className="text-yellow-300 font-bold">{Math.floor(score / 10)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg text-white/70 hover:text-yellow-300 transition-colors border border-primary/30"
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/30">
              <span className="text-white/70">Speed: </span>
              <span className="text-orange-400 font-bold">{speed.toFixed(1)}x</span>
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-3 md:px-4 py-2 rounded-lg border border-primary/30">
            <span className="text-white/70">Best: </span>
            <span className="text-yellow-300 font-bold">{Math.floor(highScore / 10)}</span>
          </div>
        </div>

        {/* Game area - 3D Road View */}
        <div
          ref={gameRef}
          className="relative w-full h-64 md:h-80 bg-gradient-to-b from-purple-900/50 to-black/80 rounded-2xl overflow-hidden cursor-pointer border-2 border-primary/40"
          style={{ perspective: '500px' }}
          onClick={() => {
            if (!isPlaying || gameOver) startGame();
          }}
        >
          {/* Road with perspective */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300%] h-full"
            style={{
              background: `
                linear-gradient(90deg, 
                  transparent 0%, 
                  transparent 35%,
                  #2d2d2d 35%,
                  #2d2d2d 65%,
                  transparent 65%,
                  transparent 100%
                )
              `,
              transform: 'perspective(300px) rotateX(60deg)',
              transformOrigin: 'bottom center',
            }}
          >
            {/* Lane dividers */}
            <div className="absolute left-[41%] top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400/80 via-yellow-400/40 to-yellow-400/10" style={{ boxShadow: '0 0 10px yellow' }} />
            <div className="absolute left-[59%] top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400/80 via-yellow-400/40 to-yellow-400/10" style={{ boxShadow: '0 0 10px yellow' }} />
          </div>

          {/* Road segments (dashed lines) */}
          {roadSegments.filter(seg => seg.z > 0 && seg.z < 1000).map(seg => {
            const pos = get3DPosition(seg.z, 1);
            if (pos.scale < 0.1) return null;
            return (
              <div
                key={seg.id}
                className="absolute w-2 h-4 bg-white/60 rounded"
                style={{
                  left: `calc(50% + ${pos.x}px - 4px)`,
                  bottom: `${pos.y}px`,
                  transform: `scale(${pos.scale})`,
                  opacity: Math.min(1, pos.scale * 2),
                }}
              />
            );
          })}

          {/* Obstacles */}
          {obstacles.filter(obs => obs.z > 0 && obs.z < 1000).map(obs => {
            const pos = get3DPosition(obs.z, obs.lane);
            if (pos.scale < 0.1) return null;
            return (
              <div
                key={obs.id}
                className="absolute text-2xl md:text-4xl transition-transform"
                style={{
                  left: `calc(50% + ${pos.x}px - 16px)`,
                  bottom: `${pos.y}px`,
                  transform: `scale(${pos.scale * 1.5})`,
                  opacity: Math.min(1, pos.scale * 2),
                  filter: `drop-shadow(0 0 5px rgba(0,0,0,0.5))`,
                  zIndex: Math.floor(1000 - obs.z),
                }}
              >
                {getObstacleEmoji(obs.type)}
              </div>
            );
          })}

          {/* Collectibles */}
          {collectibles.filter(c => !c.collected && c.z > 0 && c.z < 1000).map(c => {
            const pos = get3DPosition(c.z, c.lane);
            if (pos.scale < 0.1) return null;
            return (
              <div
                key={c.id}
                className="absolute text-xl md:text-3xl animate-bounce"
                style={{
                  left: `calc(50% + ${pos.x}px - 12px)`,
                  bottom: `${pos.y + 20}px`,
                  transform: `scale(${pos.scale * 1.2})`,
                  opacity: Math.min(1, pos.scale * 2),
                  filter: `drop-shadow(0 0 8px gold)`,
                  zIndex: Math.floor(1000 - c.z),
                }}
              >
                {getCollectibleEmoji(c.type)}
              </div>
            );
          })}

          {/* Bike (Player) */}
          <div
            className="absolute transition-all duration-150 ease-out"
            style={{
              left: `calc(50% + ${LANES[playerLane] * 0.8}px - 20px)`,
              bottom: '40px',
              transform: `rotateY(${bikeAngle}deg) ${isMoving ? 'scale(0.95)' : 'scale(1)'}`,
              zIndex: 100,
            }}
          >
            {/* Low-poly bike representation */}
            <div className="relative">
              {/* Bike body */}
              <div 
                className="w-10 h-14 md:w-12 md:h-16 relative"
                style={{
                  filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.5))',
                }}
              >
                {/* Main body */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10 bg-gradient-to-t from-red-700 to-red-500 rounded-t-lg" 
                  style={{ clipPath: 'polygon(20% 100%, 80% 100%, 100% 40%, 50% 0%, 0% 40%)' }}
                />
                {/* Handlebars */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gray-700 rounded-full" />
                {/* Front wheel */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-900 rounded-full border-2 border-gray-600">
                  <div className="absolute inset-1 rounded-full border border-gray-500" />
                </div>
                {/* Headlight */}
                <div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-2 bg-yellow-300 rounded-full"
                  style={{ boxShadow: '0 0 20px yellow, 0 0 40px yellow' }}
                />
                {/* Speed lines when moving */}
                {isPlaying && !gameOver && (
                  <>
                    <div className="absolute -bottom-2 left-0 w-1 h-6 bg-gradient-to-t from-transparent to-white/30 rounded" />
                    <div className="absolute -bottom-2 right-0 w-1 h-6 bg-gradient-to-t from-transparent to-white/30 rounded" />
                  </>
                )}
              </div>
              
              {/* Exhaust flames when boosting */}
              {speed > 5 && isPlaying && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xl animate-pulse">
                  🔥
                </div>
              )}
            </div>
          </div>

          {/* Start / Game Over overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md">
              <div className="text-center px-4 zoom-in">
                {gameOver ? (
                  <>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-red-400 mb-2 wiggle-animation">
                      💀 WASTED 💀
                    </h3>
                    <p className="text-white/80 mb-1 text-sm">
                      Distance: <span className="text-yellow-300 font-bold">{Math.floor(score / 10)}m</span>
                    </p>
                    {Math.floor(score / 10) < 20 && (
                      <p className="text-red-300/80 text-[10px] mb-1">
                        {Math.floor(score / 10)}m? That's not even a warm-up lap 🏃
                      </p>
                    )}
                    <p className="text-xs text-white/70 italic mb-2 max-w-xs mx-auto font-medium">
                      {funnyMessage}
                    </p>
                    <p className="text-white/40 text-[10px] mb-3">
                      (The obstacles are laughing at you rn 😂)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4 bounce-animation">🏍️</div>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-2">Ready to Ride?</h3>
                    <p className="text-xs text-white/70 mb-2">Dodge obstacles in this retro endless runner!</p>
                    <p className="text-xs text-yellow-300/80 mb-2">🪙 Collect coins & boosts for speed!</p>
                    <p className="text-xs text-white/50 mb-2">← → Keys or Swipe to steer!</p>
                  </>
                )}
                <p className="text-yellow-300 text-xs md:text-sm animate-pulse">
                  {gameOver ? "Tap or SPACE to ride again! 🔄" : "Tap or SPACE to start! 🚀"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="text-center mt-4 text-white/60 text-xs">
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">←</span>
            <span className="text-white/40">/</span>
            <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">→</span>
            <span className="text-white/40">=</span>
            <span className="text-yellow-300">Steer</span>
            <span className="mx-2 text-white/20">|</span>
            <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">SPACE</span>
            <span className="text-white/40">=</span>
            <span className="text-yellow-300">Start</span>
          </div>
          <p className="mt-2 text-white/30 text-xs italic">
            Pro tip: Watch for the pizza slices... they're extra slippery! 🍕
          </p>
        </div>
      </div>
    </section>
  );
};

export default PuzzlePage;
