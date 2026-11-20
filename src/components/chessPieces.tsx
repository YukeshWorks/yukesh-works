import { useContext } from "react";
import { PieceSetContext, type PieceSet } from "./chessPieceSet";
import type { Color, PieceType } from "@/lib/chess";

/*
 * Original vector chess pieces (100×100) in three styles:
 *  - royal:   detailed tournament-style silhouettes, ivory and ebony (default)
 *  - classic: the simpler first set
 *  - neon:    the classic shapes as glowing outlines on dark glass
 * Fills come from shared gradients declared once in <ChessDefs />. The active style
 * flows through context, so every board, tray and drag ghost follows it.
 */



const STROKE: Record<Color, string> = { w: "#2b241c", b: "#c9b98f" };
const NEON: Record<Color, string> = { w: "#67e8f9", b: "#f472b6" };

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
      <radialGradient id="chess-royal-w" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stopColor="#fffdf7" />
        <stop offset="0.45" stopColor="#f3e7cf" />
        <stop offset="0.85" stopColor="#d2bb90" />
        <stop offset="1" stopColor="#b39463" />
      </radialGradient>
      <radialGradient id="chess-royal-b" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stopColor="#6d5f6b" />
        <stop offset="0.4" stopColor="#3a2f3a" />
        <stop offset="0.85" stopColor="#1a1219" />
        <stop offset="1" stopColor="#0a070a" />
      </radialGradient>
      <linearGradient id="chess-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

/* ---------- classic shapes (also used for neon) ---------- */
const Base = () => <rect x="23" y="77" width="54" height="12" rx="5" />;
const CLASSIC: Record<PieceType, (detail: string) => JSX.Element> = {
  p: () => (<><path d="M38 79 Q40 60 44 50 L56 50 Q60 60 62 79 Z" /><rect x="35" y="46" width="30" height="7" rx="3" /><circle cx="50" cy="33" r="13" /><Base /></>),
  r: () => (<><path d="M34 79 L37 42 L63 42 L66 79 Z" /><path d="M29 20 L38 20 L38 27 L45 27 L45 20 L55 20 L55 27 L62 27 L62 20 L71 20 L71 44 L29 44 Z" /><rect x="32" y="62" width="36" height="6" rx="2" /><Base /></>),
  b: d => (<><path d="M38 79 Q41 62 44 54 L56 54 Q59 62 62 79 Z" /><rect x="34" y="49" width="32" height="7" rx="3" /><path d="M50 15 C65 27 65 41 58 50 L42 50 C35 41 35 27 50 15 Z" /><path d="M55 26 L46 37" stroke={d} strokeWidth="3.2" strokeLinecap="round" fill="none" /><circle cx="50" cy="12" r="4.5" /><Base /></>),
  n: d => (<><path d="M68 80 L30 80 Q29 67 39 58 Q46 52 46 47 Q38 52 31 50 Q22 46 25 38 Q29 32 38 28 Q43 22 45 15 Q49 20 52 18 Q67 21 73 40 Q78 58 68 80 Z" /><circle cx="43" cy="31" r="2.6" fill={d} stroke="none" /><path d="M56 22 Q67 33 69 54" stroke={d} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.7" /><Base /></>),
  q: () => (<><path d="M36 79 Q40 60 42 50 L58 50 Q60 60 64 79 Z" /><path d="M33 50 L28 26 L35 40 L39 20 L45 38 L50 16 L55 38 L61 20 L65 40 L72 26 L67 50 Z" /><rect x="32" y="46" width="36" height="8" rx="3" />{[[28, 23], [39, 17], [50, 13], [61, 17], [72, 23]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" />)}<Base /></>),
  k: () => (<><path d="M36 79 Q40 62 42 50 L58 50 Q60 62 64 79 Z" /><path d="M32 50 Q28 31 50 29 Q72 31 68 50 Z" /><rect x="32" y="46" width="36" height="8" rx="3" /><path d="M47 7 h6 v7 h7 v6 h-7 v10 h-6 v-10 h-7 v-6 h7 Z" /><Base /></>),
};

/* ---------- royal shapes: two-tier plinth, waisted bodies, carved details ---------- */
const Plinth = () => (
  <>
    <path d="M27 79 h46 l-3 -6 H30 Z" />
    <path d="M20 90 h60 a3 3 0 0 0 3 -3 v-2 a5 5 0 0 0 -5 -5 H22 a5 5 0 0 0 -5 5 v2 a3 3 0 0 0 3 3 Z" />
  </>
);
const ROYAL: Record<PieceType, (detail: string) => JSX.Element> = {
  p: () => (
    <>
      <path d="M33 74 C35 63 42 57 44 51 L56 51 C58 57 65 63 67 74 Z" />
      <ellipse cx="50" cy="50" rx="13" ry="4" />
      <circle cx="50" cy="35" r="12.5" />
      <Plinth />
    </>
  ),
  r: d => (
    <>
      <path d="M31 74 C34 62 36 52 36 41 L64 41 C64 52 66 62 69 74 Z" />
      <path d="M29 17 h9 v7 h6 v-7 h12 v7 h6 v-7 h9 v17 l-4 7 H33 l-4 -7 Z" />
      <rect x="34" y="40" width="32" height="5" rx="1.5" />
      <path d="M40 54 h20 M38 63 h24 M50 54 v9 M44 45 v9 M57 45 v9" stroke={d} strokeWidth="1.6" fill="none" opacity="0.55" />
      <Plinth />
    </>
  ),
  b: d => (
    <>
      <path d="M35 74 C38 63 43 58 44 53 L56 53 C57 58 62 63 65 74 Z" />
      <ellipse cx="50" cy="52" rx="14" ry="4.5" />
      <ellipse cx="50" cy="57.5" rx="9.5" ry="2.2" />
      <path d="M50 13 C63 22 67 35 61 46 C58 50 42 50 39 46 C33 35 37 22 50 13 Z" />
      <path d="M57 24 L46 37" stroke={d} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="10" r="4.5" />
      <Plinth />
    </>
  ),
  n: d => (
    <>
      <path d="M68 74 L32 74 C32 64 37 58 44 52 C46 50 46 47 44 46 C39 49 34 51 29 50 C23 49 20 44 23 40 C26 35 32 32 36 28 C39 25 40 20 41 15 L45 20 L48 13 L53 20 C65 22 73 32 74 46 C75 57 71 66 68 74 Z" />
      <path d="M53 21 Q62 25 67 33 M57 29 Q65 35 69 43 M61 38 Q67 46 70 54" stroke={d} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M30 41 Q35 39 39 41" stroke={d} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="41" cy="31" r="2.6" fill={d} stroke="none" />
      <circle cx="26.5" cy="44" r="1.3" fill={d} stroke="none" />
      <Plinth />
    </>
  ),
  q: d => (
    <>
      <path d="M33 74 C37 62 42 56 43 49 L57 49 C58 56 63 62 67 74 Z" />
      <ellipse cx="50" cy="48" rx="15" ry="4.5" />
      <path d="M33 45 L26 21 L37 33 L41 16 L47 32 L50 12 L53 32 L59 16 L63 33 L74 21 L67 45 Z" />
      <path d="M34 39 Q50 45 66 39" stroke={d} strokeWidth="1.8" fill="none" opacity="0.6" />
      {[[26, 19], [41, 13.5], [50, 9.5], [59, 13.5], [74, 19]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.6" />)}
      <Plinth />
    </>
  ),
  k: d => (
    <>
      <path d="M33 74 C37 62 42 56 43 51 L57 51 C58 56 63 62 67 74 Z" />
      <ellipse cx="50" cy="50" rx="15" ry="4.5" />
      <path d="M33 46 C29 34 38 26 50 26 C62 26 71 34 67 46 Z" />
      <path d="M36 40 Q50 46 64 40 M42 30 Q50 34 58 30" stroke={d} strokeWidth="1.8" fill="none" opacity="0.6" />
      <path d="M47 4 h6 v6 h6 v6 h-6 v10 h-6 v-10 h-6 v-6 h6 Z" />
      <Plinth />
    </>
  ),
};

export const PieceSvg = ({ t, c, className, style, set: forced }: { t: PieceType; c: Color; className?: string; style?: React.CSSProperties; set?: PieceSet }) => {
  const ctx = useContext(PieceSetContext);
  const set = forced ?? ctx;
  if (set === "neon") {
    const col = NEON[c];
    return (
      <svg viewBox="0 0 100 100" className={className} style={{ filter: `drop-shadow(0 0 3px ${col}) drop-shadow(0 0 7px ${col}88)`, ...style }} aria-hidden="true">
        <g fill="rgba(8,10,20,0.82)" stroke={col} strokeWidth={3} strokeLinejoin="round">{CLASSIC[t](col)}</g>
      </svg>
    );
  }
  const royal = set === "royal";
  const detail = STROKE[c];
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      <g fill={`url(#chess-${royal ? "royal" : "fill"}-${c})`} stroke={detail} strokeWidth={c === "w" ? (royal ? 2.6 : 3) : (royal ? 2.2 : 2.4)} strokeLinejoin="round">
        {(royal ? ROYAL : CLASSIC)[t](detail)}
      </g>
      <ellipse cx={royal ? 41 : 40} cy="45" rx="6" ry={royal ? 20 : 22} fill="url(#chess-shine)" opacity={c === "w" ? 0.5 : 0.25} />
    </svg>
  );
};

/** Knight silhouette in currentColor, for menus and buttons. */
export const KnightIcon = ({ size = 20, className, style }: { size?: number | string; className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="14 9 72 84" width={size} height={size} className={className} style={style} aria-hidden="true">
    <path fill="currentColor" d="M68 74 L32 74 C32 64 37 58 44 52 C46 50 46 47 44 46 C39 49 34 51 29 50 C23 49 20 44 23 40 C26 35 32 32 36 28 C39 25 40 20 41 15 L45 20 L48 13 L53 20 C65 22 73 32 74 46 C75 57 71 66 68 74 Z M20 90 h60 a3 3 0 0 0 3 -3 v-2 a5 5 0 0 0 -5 -5 H22 a5 5 0 0 0 -5 5 v2 a3 3 0 0 0 3 3 Z" />
    <circle cx="41" cy="31" r="3" fill="rgba(0,0,0,0.55)" />
  </svg>
);
