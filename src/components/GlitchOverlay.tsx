import { useEffect, useState } from "react";

interface GlitchOverlayProps {
  isActive: boolean;
}

const GlitchOverlay = ({ isActive }: GlitchOverlayProps) => {
  const [lines, setLines] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate random line positions
      setLines(Array.from({ length: 8 }, () => Math.random() * 100));
      
      // Clear after animation
      const timer = setTimeout(() => setLines([]), 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive && lines.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Glitch flash overlay */}
      <div 
        className={`absolute inset-0 ${isActive ? 'animate-glitch-flash' : ''}`}
        style={{ mixBlendMode: 'screen' }}
      />
      
      {/* Horizontal glitch lines */}
      {lines.map((pos, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-[2px] bg-primary/60"
          style={{
            top: `${pos}%`,
            animation: `glitchScan 0.3s ease-out ${i * 0.03}s forwards`,
            boxShadow: '0 0 10px hsl(var(--primary))',
          }}
        />
      ))}
      
      {/* RGB split effect bars */}
      {isActive && (
        <>
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(transparent 50%, hsl(var(--primary) / 0.03) 50%)',
              backgroundSize: '100% 4px',
              animation: 'scanlines 0.1s linear infinite',
            }}
          />
          <div 
            className="absolute top-1/3 left-0 right-0 h-8 opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(0 80% 50% / 0.3), transparent)',
              animation: 'glitchBar 0.2s ease-out forwards',
            }}
          />
          <div 
            className="absolute top-2/3 left-0 right-0 h-4 opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(180 80% 50% / 0.3), transparent)',
              animation: 'glitchBar 0.25s ease-out 0.05s forwards',
            }}
          />
        </>
      )}

      <style>{`
        @keyframes glitchScan {
          0% { opacity: 1; transform: scaleX(0); }
          50% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(1); }
        }
        
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        
        @keyframes glitchBar {
          0% { transform: translateX(-100%); opacity: 0.5; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        .animate-glitch-flash {
          animation: glitchFlashBg 0.3s steps(1) forwards;
        }
        
        @keyframes glitchFlashBg {
          0% { background: transparent; }
          10% { background: hsl(var(--primary) / 0.08); }
          20% { background: transparent; }
          30% { background: hsl(var(--primary) / 0.04); }
          40%, 100% { background: transparent; }
        }
      `}</style>
    </div>
  );
};

export default GlitchOverlay;
