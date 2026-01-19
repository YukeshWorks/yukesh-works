import { useState, useEffect, useCallback } from "react";

// Kawaii face expressions based on reference images
const kawaiFaces = [
  // Happy closed eyes
  { leftEye: "^", rightEye: "^", mouth: "ω" },
  // Excited
  { leftEye: "✧", rightEye: "✧", mouth: "▽" },
  // Sleepy
  { leftEye: "−", rightEye: "−", mouth: "ω" },
  // Surprised
  { leftEye: "◎", rightEye: "◎", mouth: "○" },
  // Shy blush
  { leftEye: ">", rightEye: "<", mouth: "ω" },
  // Happy wink
  { leftEye: "◕", rightEye: "−", mouth: "∀" },
  // Cute smile
  { leftEye: "◕", rightEye: "◕", mouth: "ω" },
  // Playful
  { leftEye: "≧", rightEye: "≦", mouth: "ー" },
];

const ChibiAnimeGirl = () => {
  const [position, setPosition] = useState({ x: -80, y: 50 });
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isRunning, setIsRunning] = useState(true);
  const [reaction, setReaction] = useState<"none" | "wave" | "angry" | "poof">("none");
  const [visible, setVisible] = useState(true);
  const [currentFace, setCurrentFace] = useState(0);

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

  // Random movement across screen
  useEffect(() => {
    if (!isRunning || !visible) return;

    const moveInterval = setInterval(() => {
      setPosition(prev => {
        const speed = 1.5 + Math.random() * 1.5;
        let newX = direction === "right" ? prev.x + speed : prev.x - speed;
        
        if (newX > window.innerWidth + 30) {
          setDirection("left");
          newX = window.innerWidth + 30;
        } else if (newX < -80) {
          setDirection("right");
          newX = -80;
        }
        
        const newY = 50 + Math.sin(Date.now() / 400) * 3;
        
        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(moveInterval);
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
    
    // Set reaction-specific face
    if (randomReaction === "angry") {
      setCurrentFace(7); // Playful angry face
    } else if (randomReaction === "wave") {
      setCurrentFace(1); // Excited face
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
      className="fixed bottom-0 z-40 cursor-pointer select-none group"
      style={{
        left: position.x,
        bottom: position.y,
        transform: `scaleX(${direction === "left" ? -1 : 1})`,
        transition: isRunning ? 'none' : 'transform 0.15s ease',
      }}
      onClick={handleClick}
    >
      {/* Kawaii chibi character */}
      <svg
        width="40"
        height="48"
        viewBox="0 0 40 48"
        className={`transition-transform duration-150 ${
          reaction === "wave" ? "animate-wave" : 
          reaction === "angry" ? "animate-shake-small" : 
          reaction === "poof" ? "animate-poof" : ""
        }`}
      >
        {/* Hair */}
        <ellipse cx="20" cy="16" rx="14" ry="12" fill="hsl(var(--primary))" opacity="0.9" />
        <ellipse cx="9" cy="20" rx="4" ry="8" fill="hsl(var(--primary))" opacity="0.8" />
        <ellipse cx="31" cy="20" rx="4" ry="8" fill="hsl(var(--primary))" opacity="0.8" />
        {/* Hair bangs */}
        <path d="M8 12 Q12 8 16 14" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" opacity="0.9" />
        <path d="M24 14 Q28 8 32 12" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" opacity="0.9" />
        
        {/* Face */}
        <ellipse cx="20" cy="18" rx="10" ry="10" fill="#FFE4D6" />
        
        {/* Kawaii Eyes - text based */}
        <text 
          x="13" 
          y="19" 
          fontSize="7" 
          fill="#333" 
          fontFamily="sans-serif"
          style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "13px 19px" }}
        >
          {face.leftEye}
        </text>
        <text 
          x="24" 
          y="19" 
          fontSize="7" 
          fill="#333" 
          fontFamily="sans-serif"
          style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "24px 19px" }}
        >
          {face.rightEye}
        </text>
        
        {/* Blush */}
        <ellipse cx="11" cy="21" rx="2.5" ry="1.2" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="29" cy="21" rx="2.5" ry="1.2" fill="#FFB6C1" opacity="0.5" />
        
        {/* Kawaii Mouth */}
        <text 
          x="17" 
          y="25" 
          fontSize="6" 
          fill="#333" 
          fontFamily="sans-serif"
          style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "20px 25px" }}
        >
          {reaction === "angry" ? "△" : face.mouth}
        </text>
        
        {/* Body/Dress */}
        <path d="M13 28 Q20 26 27 28 L29 40 Q20 42 11 40 Z" fill="hsl(var(--primary))" />
        
        {/* Legs - animated running */}
        <g className={isRunning ? "animate-chibi-run" : ""}>
          <rect x="14" y="38" width="3.5" height="7" rx="1.5" fill="#FFE4D6" />
          <rect x="22" y="38" width="3.5" height="7" rx="1.5" fill="#FFE4D6" />
        </g>
        
        {/* Arms */}
        <ellipse 
          cx="9" 
          cy="32" 
          rx="3" 
          ry="5" 
          fill="#FFE4D6"
          className={reaction === "wave" ? "animate-arm-wave" : ""}
        />
        <ellipse cx="31" cy="32" rx="3" ry="5" fill="#FFE4D6" />
        
        {/* Reaction effects */}
        {reaction === "wave" && (
          <g style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "20px 10px" }}>
            <text x="30" y="10" fontSize="8">✨</text>
          </g>
        )}
        {reaction === "angry" && (
          <g style={{ transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "20px 5px" }}>
            <text x="28" y="6" fontSize="7">💢</text>
          </g>
        )}
        {reaction === "poof" && (
          <g className="animate-poof-particles">
            <circle cx="10" cy="15" r="2" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="30" cy="10" r="3" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="20" cy="5" r="2" fill="hsl(var(--primary))" opacity="0.4" />
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
