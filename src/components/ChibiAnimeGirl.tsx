import { useState, useEffect, useCallback } from "react";

const ChibiAnimeGirl = () => {
  const [position, setPosition] = useState({ x: -100, y: 70 });
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isRunning, setIsRunning] = useState(true);
  const [reaction, setReaction] = useState<"none" | "wave" | "angry" | "poof">("none");
  const [visible, setVisible] = useState(true);

  // Random movement across screen
  useEffect(() => {
    if (!isRunning || !visible) return;

    const moveInterval = setInterval(() => {
      setPosition(prev => {
        const speed = 2 + Math.random() * 2;
        let newX = direction === "right" ? prev.x + speed : prev.x - speed;
        
        // Reverse direction at screen edges
        if (newX > window.innerWidth + 50) {
          setDirection("left");
          newX = window.innerWidth + 50;
        } else if (newX < -100) {
          setDirection("right");
          newX = -100;
        }
        
        // Random Y bounce
        const newY = 70 + Math.sin(Date.now() / 300) * 5;
        
        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(moveInterval);
  }, [direction, isRunning, visible]);

  // Random direction changes
  useEffect(() => {
    if (!visible) return;
    
    const directionInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        setDirection(prev => prev === "left" ? "right" : "left");
      }
    }, 2000);

    return () => clearInterval(directionInterval);
  }, [visible]);

  // Random pause
  useEffect(() => {
    if (!visible) return;
    
    const pauseInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setIsRunning(false);
        setTimeout(() => setIsRunning(true), 1000 + Math.random() * 1500);
      }
    }, 3000);

    return () => clearInterval(pauseInterval);
  }, [visible]);

  const handleClick = useCallback(() => {
    const reactions: ("wave" | "angry" | "poof")[] = ["wave", "angry", "poof"];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    
    setIsRunning(false);
    setReaction(randomReaction);
    
    if (randomReaction === "poof") {
      setTimeout(() => {
        setVisible(false);
        // Reappear after a while
        setTimeout(() => {
          setVisible(true);
          setPosition({ x: -100, y: 70 });
          setDirection("right");
          setReaction("none");
          setIsRunning(true);
        }, 5000);
      }, 500);
    } else {
      setTimeout(() => {
        setReaction("none");
        setIsRunning(true);
      }, 1500);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 z-40 cursor-pointer select-none"
      style={{
        left: position.x,
        bottom: position.y,
        transform: `scaleX(${direction === "left" ? -1 : 1})`,
        transition: isRunning ? 'none' : 'transform 0.2s ease',
      }}
      onClick={handleClick}
    >
      {/* Chibi anime girl SVG */}
      <svg
        width="50"
        height="60"
        viewBox="0 0 50 60"
        className={`transition-transform duration-200 ${
          reaction === "wave" ? "animate-wave" : 
          reaction === "angry" ? "animate-shake-small" : 
          reaction === "poof" ? "animate-poof" : ""
        }`}
      >
        {/* Hair */}
        <ellipse cx="25" cy="22" rx="18" ry="16" fill="hsl(var(--primary))" opacity="0.9" />
        <ellipse cx="12" cy="28" rx="6" ry="10" fill="hsl(var(--primary))" opacity="0.8" />
        <ellipse cx="38" cy="28" rx="6" ry="10" fill="hsl(var(--primary))" opacity="0.8" />
        
        {/* Face */}
        <ellipse cx="25" cy="25" rx="12" ry="12" fill="#FFE4D6" />
        
        {/* Eyes */}
        <ellipse cx="20" cy="24" rx="3" ry="3.5" fill="#333">
          <animate 
            attributeName="ry" 
            values="3.5;0.5;3.5" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="30" cy="24" rx="3" ry="3.5" fill="#333">
          <animate 
            attributeName="ry" 
            values="3.5;0.5;3.5" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </ellipse>
        
        {/* Eye shine */}
        <circle cx="21" cy="23" r="1" fill="white" />
        <circle cx="31" cy="23" r="1" fill="white" />
        
        {/* Blush */}
        <ellipse cx="16" cy="28" rx="3" ry="1.5" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="34" cy="28" rx="3" ry="1.5" fill="#FFB6C1" opacity="0.6" />
        
        {/* Mouth */}
        <path 
          d={reaction === "angry" ? "M22 31 Q25 29 28 31" : "M22 30 Q25 33 28 30"} 
          stroke="#333" 
          strokeWidth="1.5" 
          fill="none"
        />
        
        {/* Body/Dress */}
        <path d="M17 38 Q25 36 33 38 L35 52 Q25 54 15 52 Z" fill="hsl(var(--primary))" />
        
        {/* Legs - animated running */}
        <g className={isRunning ? "animate-chibi-run" : ""}>
          <rect x="19" y="50" width="4" height="8" rx="2" fill="#FFE4D6" />
          <rect x="27" y="50" width="4" height="8" rx="2" fill="#FFE4D6" />
        </g>
        
        {/* Arms */}
        <ellipse 
          cx="13" 
          cy="42" 
          rx="4" 
          ry="6" 
          fill="#FFE4D6"
          className={reaction === "wave" ? "animate-arm-wave" : ""}
        />
        <ellipse cx="37" cy="42" rx="4" ry="6" fill="#FFE4D6" />
        
        {/* Reaction effects */}
        {reaction === "wave" && (
          <text x="40" y="15" fontSize="12">👋</text>
        )}
        {reaction === "angry" && (
          <>
            <text x="35" y="10" fontSize="10">💢</text>
            <path d="M18 18 L22 16 M28 16 L32 18" stroke="#333" strokeWidth="1.5" />
          </>
        )}
        {reaction === "poof" && (
          <g className="animate-poof-particles">
            <circle cx="15" cy="20" r="3" fill="hsl(var(--primary))" opacity="0.5" />
            <circle cx="35" cy="15" r="4" fill="hsl(var(--primary))" opacity="0.5" />
            <circle cx="25" cy="10" r="3" fill="hsl(var(--primary))" opacity="0.5" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default ChibiAnimeGirl;
