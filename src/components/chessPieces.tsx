import type { Color, PieceType } from "@/lib/chess";

/*
 * Original vector chess pieces (100×100), drawn as layered shapes so they stay sharp
 * at any size. Fills come from shared gradients declared once in <ChessDefs />.
 */

const STROKE: Record<Color, string> = { w: "#2b241c", b: "#c9b98f" };

export const ChessDefs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
    <defs>
      <linearGradient id="chess-fill-w" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.55" stopColor="#efe6d4" />
        <stop offset="1" stopColor="#c9bb9e" />
      </linearGradient>
      <linearGradient id="chess-fill-b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5b5560" />
        <stop offset="0.5" stopColor="#25222a" />
        <stop offset="1" stopColor="#0c0b0f" />
      </linearGradient>
      <linearGradient id="chess-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const Base = () => <rect x="23" y="77" width="54" height="12" rx="5" />;

const SHAPES: Record<PieceType, (detail: string) => JSX.Element> = {
  p: () => (
    <>
      <path d="M38 79 Q40 60 44 50 L56 50 Q60 60 62 79 Z" />
      <rect x="35" y="46" width="30" height="7" rx="3" />
      <circle cx="50" cy="33" r="13" />
      <Base />
    </>
  ),
  r: () => (
    <>
      <path d="M34 79 L37 42 L63 42 L66 79 Z" />
      <path d="M29 20 L38 20 L38 27 L45 27 L45 20 L55 20 L55 27 L62 27 L62 20 L71 20 L71 44 L29 44 Z" />
      <rect x="32" y="62" width="36" height="6" rx="2" />
      <Base />
    </>
  ),
  b: d => (
    <>
      <path d="M38 79 Q41 62 44 54 L56 54 Q59 62 62 79 Z" />
      <rect x="34" y="49" width="32" height="7" rx="3" />
      <path d="M50 15 C65 27 65 41 58 50 L42 50 C35 41 35 27 50 15 Z" />
      <path d="M55 26 L46 37" stroke={d} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="12" r="4.5" />
      <Base />
    </>
  ),
  n: d => (
    <>
      <path d="M68 80 L30 80 Q29 67 39 58 Q46 52 46 47 Q38 52 31 50 Q22 46 25 38 Q29 32 38 28 Q43 22 45 15 Q49 20 52 18 Q67 21 73 40 Q78 58 68 80 Z" />
      <circle cx="43" cy="31" r="2.6" fill={d} stroke="none" />
      <path d="M56 22 Q67 33 69 54" stroke={d} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.7" />
      <Base />
    </>
  ),
  q: () => (
    <>
      <path d="M36 79 Q40 60 42 50 L58 50 Q60 60 64 79 Z" />
      <path d="M33 50 L28 26 L35 40 L39 20 L45 38 L50 16 L55 38 L61 20 L65 40 L72 26 L67 50 Z" />
      <rect x="32" y="46" width="36" height="8" rx="3" />
      {[[28, 23], [39, 17], [50, 13], [61, 17], [72, 23]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" />)}
      <Base />
    </>
  ),
  k: () => (
    <>
      <path d="M36 79 Q40 62 42 50 L58 50 Q60 62 64 79 Z" />
      <path d="M32 50 Q28 31 50 29 Q72 31 68 50 Z" />
      <rect x="32" y="46" width="36" height="8" rx="3" />
      <path d="M47 7 h6 v7 h7 v6 h-7 v10 h-6 v-10 h-7 v-6 h7 Z" />
      <Base />
    </>
  ),
};

export const PieceSvg = ({ t, c, className, style }: { t: PieceType; c: Color; className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
    <g fill={`url(#chess-fill-${c})`} stroke={STROKE[c]} strokeWidth={c === "w" ? 3 : 2.4} strokeLinejoin="round">
      {SHAPES[t](STROKE[c])}
    </g>
    {/* soft highlight on the left edge */}
    <ellipse cx="40" cy="45" rx="7" ry="22" fill="url(#chess-shine)" opacity={c === "w" ? 0.5 : 0.22} />
  </svg>
);
