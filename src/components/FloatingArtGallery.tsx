import { useState, useEffect } from "react";
import artNoir from "@/assets/art-noir.gif";
import artSpy from "@/assets/art-spy.gif";
import artFlame from "@/assets/art-flame.gif";
import artHand from "@/assets/art-hand.gif";

const artworks = [
  { src: artNoir, alt: "Noir detective" },
  { src: artSpy, alt: "Mysterious spy" },
  { src: artFlame, alt: "Burning match" },
  { src: artHand, alt: "Artistic hand" },
];

const FloatingArtGallery = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-rotate when not hovered
  useEffect(() => {
    if (isHovered || isExpanded) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % artworks.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isHovered, isExpanded]);

  return (
    <>
      {/* Floating art corner - bottom right */}
      <div 
        className="fixed bottom-20 right-4 z-50 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main floating artwork */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-2xl 
                     hover:scale-110 transition-all duration-500 ease-out
                     ring-2 ring-primary/30 hover:ring-primary/60
                     before:absolute before:inset-0 before:bg-gradient-to-t before:from-background/40 before:to-transparent before:z-10"
          style={{
            animation: 'float-art 6s ease-in-out infinite',
          }}
        >
          <img 
            src={artworks[activeIndex].src} 
            alt={artworks[activeIndex].alt}
            className="w-full h-full object-cover"
          />
          
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>

        {/* Mini navigation dots */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {artworks.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="px-2 py-1 rounded-lg glass text-[10px] text-muted-foreground whitespace-nowrap">
            Click to explore
          </div>
        </div>
      </div>

      {/* Expanded gallery overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex items-center justify-center animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl w-full px-6">
            {/* Close hint */}
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-muted-foreground text-xs">
              Click anywhere to close
            </p>
            
            {/* Gallery grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {artworks.map((art, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl 
                             ring-2 ring-border hover:ring-primary transition-all duration-300
                             hover:scale-105 cursor-pointer group/item"
                  style={{
                    animation: `scale-in 0.5s ease-out ${idx * 0.1}s both`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={art.src} 
                    alt={art.alt}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover label */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent
                                  opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-foreground font-medium">{art.alt}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Gallery title */}
            <div className="text-center mt-8">
              <p className="text-primary text-xs uppercase tracking-[0.3em] mb-1">Art Collection</p>
              <h3 className="text-xl font-bold text-foreground">Visual Vibes</h3>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-art {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(2deg); }
          75% { transform: translateY(4px) rotate(-1deg); }
        }
      `}</style>
    </>
  );
};

export default FloatingArtGallery;
