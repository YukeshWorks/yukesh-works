import { useState, useEffect, useCallback, useRef } from "react";

// Kawaii face expressions
const kawaiFaces = [
  { leftEye: "^", rightEye: "^", mouth: "ω" },
  { leftEye: "✧", rightEye: "✧", mouth: "▽" },
  { leftEye: "−", rightEye: "−", mouth: "ω" },
  { leftEye: "◎", rightEye: "◎", mouth: "○" },
  { leftEye: ">", rightEye: "<", mouth: "ω" },
  { leftEye: "◕", rightEye: "−", mouth: "∀" },
  { leftEye: "◕", rightEye: "◕", mouth: "ω" },
  { leftEye: "≧", rightEye: "≦", mouth: "ー" },
];

const ChibiAnimeGirl = () => {
  const [position, setPosition] = useState({ x: -80, y: 50 });
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isRunning, setIsRunning] = useState(true);
  const [reaction, setReaction] = useState<"none" | "wave" | "angry" | "poof">("none");
  const [visible, setVisible] = useState(true);
  const [currentFace, setCurrentFace] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef(0);

  // Change face expression randomly
  useEffect(() => {
    if (!visible) return;
    
    const faceInterval = setInterval(() => {
      if (Math.random() < 0.3 && reaction === "none") {
        setCurrentFace(Math.floor(Math.random() * kawaiFaces.length));
      }
    }, 3000);

    return () => clearInterval(faceInterval);
  }, [visible, reaction]);

  // Smooth animation using requestAnimationFrame
  useEffect(() => {
    if (!isRunning || !visible) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      
      if (delta > 16) { // ~60fps cap
        lastTimeRef.current = timestamp;
        
        setPosition(prev => {
          const speed = 1.5;
          let newX = direction === "right" ? prev.x + speed : prev.x - speed;
          
          if (newX > window.innerWidth + 30) {
            setDirection("left");
            newX = window.innerWidth + 30;
          } else if (newX < -80) {
            setDirection("right");
            newX = -80;
          }
          
          const newY = 50 + Math.sin(timestamp / 400) * 3;
          
          return { x: newX, y: newY };
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [direction, isRunning, visible]);

  // Random direction changes
  useEffect(() => {
    if (!visible) return;
    
    const directionInterval = setInterval(() => {
      if (Math.random() < 0.08) {
        setDirection(prev => prev === "left" ? "right" : "left");
      }
    }, 2500);

    return () => clearInterval(directionInterval);
  }, [visible]);

  // Random pause
  useEffect(() => {
    if (!visible) return;
    
    const pauseInterval = setInterval(() => {
      if (Math.random() < 0.12) {
        setIsRunning(false);
        setTimeout(() => setIsRunning(true), 800 + Math.random() * 1200);
      }
    }, 4000);

    return () => clearInterval(pauseInterval);
  }, [visible]);

  const handleClick = useCallback(() => {
    const reactions: ("wave" | "angry" | "poof")[] = ["wave", "angry", "poof"];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    
    setIsRunning(false);
    setReaction(randomReaction);
    
    if (randomReaction === "angry") {
      setCurrentFace(7);
    } else if (randomReaction === "wave") {
      setCurrentFace(1);
    }
    
    if (randomReaction === "poof") {
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setVisible(true);
          setPosition({ x: -80, y: 50 });
          setDirection("right");
          setReaction("none");
          setIsRunning(true);
          setCurrentFace(0);
        }, 4000);
      }, 400);
    } else {
      setTimeout(() => {
        setReaction("none");
        setIsRunning(true);
        setCurrentFace(0);
      }, 1200);
    }
  }, []);

  if (!visible) return null;

  const face = kawaiFaces[currentFace];

  return (
    <div
      className="fixed bottom-0 z-40 cursor-pointer select-none group will-change-transform"
      style={{
        left: position.x,
        bottom: position.y,
        transform: `scaleX(${direction === "left" ? -1 : 1})`,
      }}
      onClick={handleClick}
    >
      {/* Improved chibi character with better body proportions */}
      <svg
        width="50"
        height="65"
        viewBox="0 0 50 65"
        className={`transition-transform duration-150 ${
          reaction === "wave" ? "animate-wave" : 
          reaction === "angry" ? "animate-shake-small" : 
          reaction === "poof" ? "animate-poof" : ""
        }`}
      >
        {/* Hair - fuller anime style */}
        <ellipse cx="25" cy="18" rx="16" ry="14" fill="hsl(var(--primary))" opacity="0.9" />
        {/* Side hair strands */}
        <ellipse cx="10" cy="26" rx="5" ry="12" fill="hsl(var(--primary))" opacity="0.85" />
        <ellipse cx="40" cy="26" rx="5" ry="12" fill="hsl(var(--primary))" opacity="0.85" />
        {/* Hair bangs */}
        <path d="M10 14 Q16 6 22 16" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" opacity="0.95" />
        <path d="M28 16 Q34 6 40 14" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" opacity="0.95" />
        <path d="M18 12 Q25 4 32 12" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" opacity="0.9" />
        
        {/* Cat ears */}
        <path d="M8 10 L12 2 L18 12" fill="hsl(var(--primary))" />
        <path d="M32 12 L38 2 L42 10" fill="hsl(var(--primary))" />
        <path d="M10 9 L13 4 L16 10" fill="#FFB6C1" opacity="0.6" />
        <path d="M34 10 L37 4 L40 9" fill="#FFB6C1" opacity="0.6" />
        
        {/* Face */}
        <ellipse cx="25" cy="22" rx="12" ry="12" fill="#FFE4D6" />
        
        {/* Kawaii Eyes */}
        <text 
          x="17" 
          y="24" 
          fontSize="8" 
          fill="#333" 
          fontFamily="sans-serif"
          style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "17px 24px" }}
        >
          {face.leftEye}
        </text>
        <text 
          x="29" 
          y="24" 
          fontSize="8" 
          fill="#333" 
          fontFamily="sans-serif"
          style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "29px 24px" }}
        >
          {face.rightEye}
        </text>
        
        {/* Blush */}
        <ellipse cx="14" cy="27" rx="3" ry="1.5" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="36" cy="27" rx="3" ry="1.5" fill="#FFB6C1" opacity="0.5" />
        
        {/* Kawaii Mouth */}
        <text 
          x="22" 
          y="31" 
          fontSize="7" 
          fill="#333" 
          fontFamily="sans-serif"
          style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "25px 31px" }}
        >
          {reaction === "angry" ? "△" : face.mouth}
        </text>
        
        {/* Neck */}
        <rect x="22" y="33" width="6" height="4" rx="1" fill="#FFE4D6" />
        
        {/* Body/Dress - cute outfit style based on reference */}
        <path d="M14 37 Q25 35 36 37 L38 52 Q25 54 12 52 Z" fill="hsl(var(--primary))" opacity="0.9" />
        {/* Dress details - collar */}
        <path d="M18 37 Q25 40 32 37" stroke="hsl(var(--primary-foreground))" strokeWidth="1" fill="none" opacity="0.3" />
        {/* Dress pattern - polka dots */}
        <circle cx="20" cy="44" r="1.5" fill="hsl(var(--primary-foreground))" opacity="0.15" />
        <circle cx="30" cy="44" r="1.5" fill="hsl(var(--primary-foreground))" opacity="0.15" />
        <circle cx="25" cy="48" r="1.5" fill="hsl(var(--primary-foreground))" opacity="0.15" />
        <circle cx="18" cy="50" r="1.5" fill="hsl(var(--primary-foreground))" opacity="0.15" />
        <circle cx="32" cy="50" r="1.5" fill="hsl(var(--primary-foreground))" opacity="0.15" />
        
        {/* Legs */}
        <g className={isRunning ? "animate-chibi-run" : ""}>
          <rect x="17" y="52" width="5" height="10" rx="2" fill="#FFE4D6" />
          <rect x="28" y="52" width="5" height="10" rx="2" fill="#FFE4D6" />
          {/* Shoes */}
          <ellipse cx="19.5" cy="62" rx="3.5" ry="2" fill="hsl(var(--primary))" opacity="0.7" />
          <ellipse cx="30.5" cy="62" rx="3.5" ry="2" fill="hsl(var(--primary))" opacity="0.7" />
        </g>
        
        {/* Arms */}
        <ellipse 
          cx="10" 
          cy="42" 
          rx="4" 
          ry="7" 
          fill="#FFE4D6"
          className={reaction === "wave" ? "animate-arm-wave" : ""}
        />
        <ellipse cx="40" cy="42" rx="4" ry="7" fill="#FFE4D6" />
        {/* Sleeve cuffs */}
        <ellipse cx="10" cy="38" rx="4" ry="2" fill="hsl(var(--primary))" opacity="0.9" />
        <ellipse cx="40" cy="38" rx="4" ry="2" fill="hsl(var(--primary))" opacity="0.9" />
        
        {/* Reaction effects */}
        {reaction === "wave" && (
          <g style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "25px 10px" }}>
            <text x="38" y="12" fontSize="10">✨</text>
          </g>
        )}
        {reaction === "angry" && (
          <g style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "25px 5px" }}>
            <text x="36" y="8" fontSize="9">💢</text>
          </g>
        )}
        {reaction === "poof" && (
          <g className="animate-poof-particles">
            <circle cx="12" cy="18" r="3" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="38" cy="12" r="4" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="25" cy="5" r="3" fill="hsl(var(--primary))" opacity="0.4" />
          </g>
        )}
      </svg>
      
      {/* Hover tooltip */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <span className="text-[8px] px-1.5 py-0.5 rounded-full glass text-muted-foreground whitespace-nowrap">
          Click me!
        </span>
      </div>
    </div>
  );
};

export default ChibiAnimeGirl;
