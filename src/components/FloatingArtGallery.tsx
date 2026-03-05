import artNoir from "@/assets/art-noir.gif";
import artSpy from "@/assets/art-spy.gif";
import artFlame from "@/assets/art-flame.gif";
import artHand from "@/assets/art-hand.gif";

const artworks = [
  { src: artNoir, alt: "Noir" },
  { src: artSpy, alt: "Spy" },
  { src: artFlame, alt: "Flame" },
  { src: artHand, alt: "Hand" },
];

const FloatingArtGallery = () => (
  <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none overflow-hidden">
    <div className="relative h-12 md:h-16 bg-gradient-to-t from-background/80 to-transparent">
      <div className="absolute inset-0 flex items-center art-ticker">
        {[...artworks, ...artworks, ...artworks].map((art, i) => (
          <div key={i} className="flex-shrink-0 mx-6 md:mx-10 opacity-40 hover:opacity-80 transition-opacity duration-300 pointer-events-auto cursor-pointer">
            <img src={art.src} alt={art.alt} className="h-8 md:h-12 w-auto rounded-lg grayscale hover:grayscale-0 transition-all duration-500" />
          </div>
        ))}
      </div>
    </div>
    <style>{`
      .art-ticker { animation: ticker-scroll 30s linear infinite; }
      .art-ticker:hover { animation-play-state: paused; }
      @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
    `}</style>
  </div>
);

export default FloatingArtGallery;
