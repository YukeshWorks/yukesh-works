import puzzleClimb from "@/assets/puzzle-climb.png";

const PuzzleIllustration = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
      {/* Teal background matching the illustration */}
      <div className="absolute inset-0 bg-[#5fd3c5]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {/* Illustration with climbing animation */}
        <div className="relative w-full max-w-md md:max-w-lg aspect-square">
          <img
            src={puzzleClimb}
            alt="Stick figure climbing rope"
            className="w-full h-full object-contain animate-climb"
          />
        </div>
        
        {/* Optional subtle text */}
        <p className="text-black/30 text-sm mt-8 font-medium tracking-wide">
          Keep climbing
        </p>
      </div>

      {/* Climbing animation keyframes */}
      <style>{`
        @keyframes climb {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(-4px);
          }
          75% {
            transform: translateY(-12px);
          }
        }
        .animate-climb {
          animation: climb 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default PuzzleIllustration;
