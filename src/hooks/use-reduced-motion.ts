import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor's operating system asks for reduced motion. */
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia?.(QUERY).matches === true);

  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return;
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
};
