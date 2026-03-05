import { useState, useEffect } from "react";

const VHSNoiseOverlay = () => {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.7) {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 50 + Math.random() * 100);
      }
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[50]">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground) / 0.1) 2px, hsl(var(--foreground) / 0.1) 4px)',
      }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(transparent 50%, hsl(var(--background) / 0.02) 50%)',
        backgroundSize: '100% 4px',
        animation: 'vhsScroll 0.5s linear infinite',
      }} />
      {flicker && <div className="absolute inset-0 bg-foreground/[0.02]" />}
      <style>{`
        @keyframes vhsScroll { 0% { background-position: 0 0; } 100% { background-position: 0 4px; } }
      `}</style>
    </div>
  );
};

export default VHSNoiseOverlay;
