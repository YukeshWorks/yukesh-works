import { useEffect, useState } from "react";

interface GlitchOverlayProps {
  isActive: boolean;
}

const GlitchOverlay = ({ isActive }: GlitchOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"entering" | "exiting" | "idle">("idle");

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      setPhase("entering");
      
      const exitTimer = setTimeout(() => {
        setPhase("exiting");
      }, 150);
      
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setPhase("idle");
      }, 350);
      
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isActive]);

  if (!isActive && !visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      {/* Smooth fade overlay - GPU accelerated */}
      <div
        className="absolute inset-0 will-change-opacity"
        style={{
          background: "hsl(var(--background))",
          opacity: phase === "entering" ? 0.4 : phase === "exiting" ? 0 : 0,
          transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: "translateZ(0)",
        }}
      />

      {/* Subtle light sweep - smooth motion */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.08) 50%, transparent 100%)",
          transform:
            phase === "entering"
              ? "translateX(0%) translateZ(0)"
              : "translateX(100%) translateZ(0)",
          opacity: phase === "idle" ? 0 : 1,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out",
        }}
      />
    </div>
  );
};

export default GlitchOverlay;
