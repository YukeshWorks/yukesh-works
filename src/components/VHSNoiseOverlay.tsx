import { useState, useEffect } from "react";

const VHSNoiseOverlay = () => {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    // Random flicker effect
    const flickerInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 50 + Math.random() * 100);
      }
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(flickerInterval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[50]">
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground) / 0.1) 2px, hsl(var(--foreground) / 0.1) 4px)',
        }}
      />
      
      {/* VHS tracking lines */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(transparent 50%, hsl(var(--background) / 0.02) 50%)',
          backgroundSize: '100% 4px',
          animation: 'vhsScroll 0.5s linear infinite',
        }}
      />
      
      {/* Random noise grain */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          animation: 'vhsNoise 0.2s steps(10) infinite',
        }}
      />
      
      {/* Flicker effect */}
      {flicker && (
        <div 
          className="absolute inset-0 bg-foreground/[0.02]"
          style={{ animation: 'vhsFlicker 0.1s steps(1) forwards' }}
        />
      )}
      
      {/* Occasional horizontal distortion line */}
      <div 
        className="absolute left-0 right-0 h-[2px] bg-foreground/[0.03]"
        style={{
          animation: 'vhsDistortLine 8s linear infinite',
        }}
      />

      <style>{`
        @keyframes vhsScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        
        @keyframes vhsNoise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-1%, 1%); }
          40% { transform: translate(1%, -1%); }
          50% { transform: translate(-1%, 0); }
          60% { transform: translate(1%, 0); }
          70% { transform: translate(0, 1%); }
          80% { transform: translate(0, -1%); }
          90% { transform: translate(1%, 1%); }
        }
        
        @keyframes vhsFlicker {
          0% { opacity: 0; }
          20% { opacity: 1; }
          40% { opacity: 0; }
          60% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        
        @keyframes vhsDistortLine {
          0% { top: -2px; opacity: 0; }
          5% { opacity: 1; }
          10% { top: 100%; opacity: 0; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default VHSNoiseOverlay;
