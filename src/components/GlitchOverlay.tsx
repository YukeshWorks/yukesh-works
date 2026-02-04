import { useEffect, useState, useMemo } from "react";

interface GlitchOverlayProps {
  isActive: boolean;
}

const GlitchOverlay = ({ isActive }: GlitchOverlayProps) => {
  const [visible, setVisible] = useState(false);

  // Memoize line positions for consistent rendering
  const lines = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      top: 10 + i * 15 + Math.random() * 5,
      delay: i * 0.02,
    })), [isActive]
  );

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive && !visible) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Smooth flash overlay - GPU accelerated */}
      <div 
        className="absolute inset-0 will-change-opacity"
        style={{
          background: 'hsl(var(--primary) / 0.06)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Smooth horizontal scan lines - GPU accelerated */}
      {lines.map((line, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-[2px] will-change-transform"
          style={{
            top: `${line.top}%`,
            background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)`,
            transform: visible ? 'scaleX(1) translateZ(0)' : 'scaleX(0) translateZ(0)',
            opacity: visible ? 0.8 : 0,
            transition: `transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${line.delay}s, opacity 0.15s ease-out ${line.delay}s`,
            boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
          }}
        />
      ))}
      
      {/* Subtle RGB chromatic aberration - GPU optimized */}
      {visible && (
        <>
          <div 
            className="absolute inset-0 will-change-opacity"
            style={{
              background: 'linear-gradient(transparent 50%, hsl(var(--primary) / 0.02) 50%)',
              backgroundSize: '100% 3px',
              opacity: 0.4,
              transform: 'translateZ(0)',
            }}
          />
          <div 
            className="absolute top-1/4 left-0 right-0 h-12 will-change-transform"
            style={{
              background: 'linear-gradient(90deg, transparent 10%, hsl(0 70% 50% / 0.15) 50%, transparent 90%)',
              transform: 'translateX(0) translateZ(0)',
              animation: 'smoothGlitchBar 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          />
          <div 
            className="absolute top-3/4 left-0 right-0 h-8 will-change-transform"
            style={{
              background: 'linear-gradient(90deg, transparent 10%, hsl(180 70% 50% / 0.12) 50%, transparent 90%)',
              transform: 'translateX(0) translateZ(0)',
              animation: 'smoothGlitchBar 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s forwards',
            }}
          />
        </>
      )}

      <style>{`
        @keyframes smoothGlitchBar {
          0% { 
            transform: translateX(-100%) translateZ(0); 
            opacity: 0; 
          }
          30% { 
            opacity: 1; 
          }
          100% { 
            transform: translateX(100%) translateZ(0); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
};

export default GlitchOverlay;
