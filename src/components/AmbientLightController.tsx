import { useEffect, useState, useCallback, useRef } from "react";

interface AmbientLightControllerProps {
  children: React.ReactNode;
}

const AmbientLightController = ({ children }: AmbientLightControllerProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const targetPos = useRef({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    targetPos.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setMousePosition(prev => ({
        x: prev.x + (targetPos.current.x - prev.x) * 0.08,
        y: prev.y + (targetPos.current.y - prev.y) * 0.08,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Calculate light position and intensity
  const lightX = mousePosition.x * 100;
  const lightY = mousePosition.y * 100;
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Ambient light overlay that follows mouse */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${lightX}% ${lightY}%, 
            hsl(0 85% 45% / 0.25) 0%, 
            hsl(0 80% 35% / 0.12) 25%,
            hsl(0 70% 25% / 0.05) 50%,
            transparent 70%)`,
        }}
      />
      
      {/* Secondary warm glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(circle 40% at ${lightX}% ${lightY}%, 
            hsl(25 90% 50% / 0.08) 0%, 
            transparent 60%)`,
        }}
      />
      
      {/* Edge shadow enhancement */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(ellipse 80% 80% at ${lightX}% ${lightY}%, 
            transparent 30%, 
            hsl(0 0% 0% / 0.4) 100%)`,
        }}
      />
      
      {children}
    </div>
  );
};

export default AmbientLightController;
