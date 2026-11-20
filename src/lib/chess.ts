/*
 * Chess engine: full rules (castling, en passant, promotion, check, mate, stalemate,
 * fifty-move, threefold repetition, insufficient material), SAN notation, and an
 * alpha-beta search with quiescence and iterative deepening for the computer player.
 *
 * Board: 64 squares, index = row * 8 + col, row 0 = rank 8, col 0 = file a.
 * Every piece carries a stable id so the UI can animate it from square to square.
 */

export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export interface Piece { t: PieceType; c: Color; id: number }
export interface Castling { wk: boolean; wq: boolean; bk: boolean; bq: boolean }
export interface State {
  board: (Piece | null)[];
  turn: Color;
  castle: Castling;
  ep: number | null;
  half: number;
  full: number;
}
export interface Move {
  from: number;
  to: number;
  piece: Piece;
  captured: Piece | null;
  capSq: number;
  promo?: PieceType;
  castle?: "k" | "q";
  double?: boolean;
}

export const FILES = "abcdefgh";
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const sqName = (sq: number) => FILES[sq & 7] + (8 - (sq >> 3));
export const other = (c: Color): Color => (c === "w" ? "b" : "w");
export const VALUE: Record<PieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

let nextId = 1;
export const newId = () => nextId++;

export function parseFEN(fen: string): State {
  const [pos, turn = "w", cast = "-", ep = "-", half = "0", full = "1"] = fen.trim().split(/\s+/);
  const board: (Piece | null)[] = new Array(64).fill(null);
  let i = 0;
  for (const ch of pos) {
    if (ch === "/") continue;
    if (ch >= "1" && ch <= "8") { i += Number(ch); continue; }
    const c: Color = ch === ch.toUpperCase() ? "w" : "b";
    board[i++] = { t: ch.toLowerCase() as PieceType, c, id: newId() };
  }
  return {
    board,
    turn: turn === "b" ? "b" : "w",
    castle: { wk: cast.includes("K"), wq: cast.includes("Q"), bk: cast.includes("k"), bq: cast.includes("q") },
    ep: ep !== "-" ? FILES.indexOf(ep[0]) + (8 - Number(ep[1])) * 8 : null,
    half: Number(half) || 0,
    full: Number(full) || 1,
  };
}

export function positionKey(s: State): string {
  let k = "";
  for (const p of s.board) k += p ? (p.c === "w" ? p.t.toUpperCase() : p.t) : ".";
  const c = s.castle;
  return `${k}${s.turn}${+c.wk}${+c.wq}${+c.bk}${+c.bq}${s.ep ?? "-"}`;
}

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const QUEEN = [...DIAG, ...ORTH];
const PROMOS: PieceType[] = ["q", "r", "b", "n"];

export function isAttacked(b: (Piece | null)[], sq: number, by: Color): boolean {
  const r = sq >> 3, c = sq & 7;
  // A white pawn attacks upwards (towards row 0), so it sits one row below the target.
  const pr = by === "w" ? r + 1 : r - 1;
  if (pr >= 0 && pr < 8) {
    for (const dc of [-1, 1]) {
      const cc = c + dc;
      if (cc < 0 || cc > 7) continue;
      const p = b[pr * 8 + cc];
      if (p && p.c === by && p.t === "p") return true;
    }
  }
  for (const [dr, dc] of KN) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
    const p = b[rr * 8 + cc];
    if (p && p.c === by && p.t === "n") return true;
  }
  for (const [dr, dc] of KG) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
    const p = b[rr * 8 + cc];
    if (p && p.c === by && p.t === "k") return true;
  }
  for (const [dr, dc] of DIAG) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
      const p = b[rr * 8 + cc];
      if (p) { if (p.c === by && (p.t === "b" || p.t === "q")) return true; break; }
      rr += dr; cc += dc;
    }
  }
  for (const [dr, dc] of ORTH) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
      const p = b[rr * 8 + cc];
      if (p) { if (p.c === by && (p.t === "r" || p.t === "q")) return true; break; }
      rr += dr; cc += dc;
    }
  }
  return false;
}

/** Squares of `by` pieces that attack `sq` (used to find who delivers check or mate). */
export function attackersOf(b: (Piece | null)[], sq: number, by: Color): number[] {
  const out: number[] = [];
  const r = sq >> 3, c = sq & 7;
  const pr = by === "w" ? r + 1 : r - 1;
  if (pr >= 0 && pr < 8) {
    for (const dc of [-1, 1]) {
      const cc = c + dc;
      if (cc < 0 || cc > 7) continue;
      const p = b[pr * 8 + cc];
      if (p && p.c === by && p.t === "p") out.push(pr * 8 + cc);
    }
  }
  for (const [list, type] of [[KN, "n"], [KG, "k"]] as const) {
    for (const [dr, dc] of list) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      const p = b[rr * 8 + cc];
      if (p && p.c === by && p.t === type) out.push(rr * 8 + cc);
    }
  }
  for (const [dirs, kinds] of [[DIAG, "bq"], [ORTH, "rq"]] as const) {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const p = b[rr * 8 + cc];
        if (p) { if (p.c === by && kinds.includes(p.t)) out.push(rr * 8 + cc); break; }
        rr += dr; cc += dc;
      }
    }
  }
  return out;
}

export function findKing(b: (Piece | null)[], c: Color): number {
  for (let i = 0; i < 64; i++) { const p = b[i]; if (p && p.t === "k" && p.c === c) return i; }
  return -1;
}

/** Moves that obey piece movement but may leave the own king in check. */
export function pseudoMoves(s: State, capturesOnly = false): Move[] {
  const out: Move[] = [];
  const b = s.board;
  const me = s.turn;
  const opp = other(me);
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq];
    if (!p || p.c !== me) continue;
    const r = sq >> 3, c = sq & 7;

    if (p.t === "p") {
      const dir = me === "w" ? -1 : 1;
      const start = me === "w" ? 6 : 1;
      const last = me === "w" ? 0 : 7;
      const r1 = r + dir;
      if (r1 < 0 || r1 > 7) continue;
      const add = (to: number, captured: Piece | null, capSq: number) => {
        if (to >> 3 === last) for (const pr of PROMOS) out.push({ from: sq, to, piece: p, captured, capSq, promo: pr });
        else out.push({ from: sq, to, piece: p, captured, capSq });
      };
      const one = r1 * 8 + c;
      if (!b[one] && (!capturesOnly || r1 === last)) {
        add(one, null, one);
        const two = (r + 2 * dir) * 8 + c;
        if (!capturesOnly && r === start && !b[two]) out.push({ from: sq, to: two, piece: p, captured: null, capSq: two, double: true });
      }
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        const to = r1 * 8 + cc;
        const t = b[to];
        if (t && t.c !== me) add(to, t, to);
        else if (!t && to === s.ep) { const capSq = r * 8 + cc; add(to, b[capSq], capSq); }
      }
      continue;
    }

    if (p.t === "n" || p.t === "k") {
      for (const [dr, dc] of p.t === "n" ? KN : KG) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        const to = rr * 8 + cc;
        const t = b[to];
        if (t) { if (t.c !== me) out.push({ from: sq, to, piece: p, captured: t, capSq: to }); }
        else if (!capturesOnly) out.push({ from: sq, to, piece: p, captured: null, capSq: to });
      }
      if (p.t === "k" && !capturesOnly) {
        const home = me === "w" ? 60 : 4;
        const ks = me === "w" ? s.castle.wk : s.castle.bk;
        const qs = me === "w" ? s.castle.wq : s.castle.bq;
        if (sq === home && (ks || qs) && !isAttacked(b, home, opp)) {
          const rook = (i: number) => { const x = b[i]; return !!x && x.t === "r" && x.c === me; };
          if (ks && !b[home + 1] && !b[home + 2] && rook(home + 3) && !isAttacked(b, home + 1, opp) && !isAttacked(b, home + 2, opp)) {
            out.push({ from: home, to: home + 2, piece: p, captured: null, capSq: home + 2, castle: "k" });
          }
          if (qs && !b[home - 1] && !b[home - 2] && !b[home - 3] && rook(home - 4) && !isAttacked(b, home - 1, opp) && !isAttacked(b, home - 2, opp)) {
            out.push({ from: home, to: home - 2, piece: p, captured: null, capSq: home - 2, castle: "q" });
          }
        }
      }
      continue;
    }

    for (const [dr, dc] of p.t === "b" ? DIAG : p.t === "r" ? ORTH : QUEEN) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const to = rr * 8 + cc;
        const t = b[to];
        if (t) { if (t.c !== me) out.push({ from: sq, to, piece: p, captured: t, capSq: to }); break; }
        if (!capturesOnly) out.push({ from: sq, to, piece: p, captured: null, capSq: to });
        rr += dr; cc += dc;
      }
    }
  }
  return out;
}

export function makeMove(s: State, m: Move): State {
  const b = s.board.slice();
  const p = m.piece;
  b[m.from] = null;
  if (m.captured) b[m.capSq] = null;
  // A promoted piece keeps the pawn's id, so the UI can morph it in place.
  b[m.to] = m.promo ? { t: m.promo, c: p.c, id: p.id } : p;
  if (m.castle) {
    const home = p.c === "w" ? 56 : 0;
    if (m.castle === "k") { b[home + 5] = b[home + 7]; b[home + 7] = null; }
    else { b[home + 3] = b[home]; b[home] = null; }
  }
  const castle = { ...s.castle };
  if (p.t === "k") {
    if (p.c === "w") { castle.wk = false; castle.wq = false; } else { castle.bk = false; castle.bq = false; }
  }
  for (const sq of [m.from, m.to]) {
    if (sq === 63) castle.wk = false;
    else if (sq === 56) castle.wq = false;
    else if (sq === 7) castle.bk = false;
    else if (sq === 0) castle.bq = false;
  }
  return {
    board: b,
    turn: other(s.turn),
    castle,
    ep: m.double ? (m.from + m.to) / 2 : null,
    half: p.t === "p" || m.captured ? 0 : s.half + 1,
    full: s.turn === "b" ? s.full + 1 : s.full,
  };
}

const leavesKingSafe = (s: State, m: Move) => {
  const ns = makeMove(s, m);
  const k = findKing(ns.board, s.turn);
  return k >= 0 && !isAttacked(ns.board, k, ns.turn);
};

export const legalMoves = (s: State): Move[] => pseudoMoves(s).filter(m => leavesKingSafe(s, m));
export const inCheck = (s: State) => {
  const k = findKing(s.board, s.turn);
  return k >= 0 && isAttacked(s.board, k, other(s.turn));
};

export function perft(s: State, depth: number): number {
  if (depth === 0) return 1;
  const ms = legalMoves(s);
  if (depth === 1) return ms.length;
  let n = 0;
  for (const m of ms) n += perft(makeMove(s, m), depth - 1);
  return n;
}

function insufficient(b: (Piece | null)[]): boolean {
  const rest = b.filter((p): p is Piece => !!p && p.t !== "k");
  if (rest.length === 0) return true;
  if (rest.length === 1 && (rest[0].t === "n" || rest[0].t === "b")) return true;
  if (rest.every(p => p.t === "b")) {
    const colours = new Set(b.map((p, i) => (p && p.t === "b" ? ((i >> 3) + (i & 7)) % 2 : -1)).filter(x => x >= 0));
    return colours.size === 1;
  }
  return false;
}

export type Outcome =
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" | "fifty" | "insufficient" | "repetition" };

/** `keys` is the list of position keys so far, including the current one. */
export function outcome(s: State, keys: string[]): Outcome | null {
  if (legalMoves(s).length === 0) return inCheck(s) ? { kind: "checkmate", winner: other(s.turn) } : { kind: "stalemate" };
  if (s.half >= 100) return { kind: "fifty" };
  if (insufficient(s.board)) return { kind: "insufficient" };
  const key = keys[keys.length - 1];
  if (key && keys.filter(k => k === key).length >= 3) return { kind: "repetition" };
  return null;
}

export function toSAN(s: State, m: Move): string {
  let san: string;
  if (m.castle) san = m.castle === "k" ? "O-O" : "O-O-O";
  else {
    const p = m.piece;
    const dest = sqName(m.to);
    if (p.t === "p") {
      san = (m.captured ? FILES[m.from & 7] + "x" : "") + dest + (m.promo ? "=" + m.promo.toUpperCase() : "");
    } else {
      const rivals = legalMoves(s).filter(o => o.to === m.to && o.from !== m.from && o.piece.t === p.t);
      let dis = "";
      if (rivals.length) {
        const sameFile = rivals.some(o => (o.from & 7) === (m.from & 7));
        const sameRank = rivals.some(o => o.from >> 3 === m.from >> 3);
        dis = !sameFile ? FILES[m.from & 7] : !sameRank ? String(8 - (m.from >> 3)) : sqName(m.from);
      }
      san = p.t.toUpperCase() + dis + (m.captured ? "x" : "") + dest;
    }
  }
  const ns = makeMove(s, m);
  if (inCheck(ns)) san += legalMoves(ns).length ? "+" : "#";
  return san;
}

/* ---------------- Evaluation ---------------- */

// Piece-square tables from White's point of view, row 0 = rank 8.
const PST: Record<PieceType, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    60, 60, 60, 60, 60, 60, 60, 60,
    15, 15, 22, 30, 30, 22, 15, 15,
    6, 6, 12, 24, 24, 12, 6, 6,
    2, 2, 6, 20, 20, 6, 2, 2,
    4, -2, -6, 4, 4, -6, -2, 4,
    4, 8, 8, -18, -18, 8, 8, 4,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -38, -28, -28, -28, -28, -38, -50,
    -38, -18, 0, 4, 4, 0, -18, -38,
    -28, 4, 12, 16, 16, 12, 4, -28,
    -28, 6, 16, 22, 22, 16, 6, -28,
    -28, 2, 16, 22, 22, 16, 2, -28,
    -28, 6, 12, 14, 14, 12, 6, -28,
    -38, -18, 0, 6, 6, 0, -18, -38,
    -50, -36, -28, -28, -28, -28, -36, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 2, 6, 10, 10, 6, 2, -10,
    -10, 6, 6, 10, 10, 6, 6, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 6, 0, 0, 0, 0, 6, -10,
    -20, -10, -14, -10, -10, -14, -10, -20,
  ],
  r: [
    0, 0, 0, 4, 4, 0, 0, 0,
    10, 14, 14, 14, 14, 14, 14, 10,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    0, 0, 2, 6, 6, 4, 0, 0,
  ],
  q: [
    -20, -10, -10, -4, -4, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 4, 4, 4, 4, 0, -10,
    -4, 0, 4, 6, 6, 4, 0, -4,
    -4, 0, 4, 6, 6, 4, 0, -4,
    -10, 2, 4, 4, 4, 4, 0, -10,
    -10, 0, 2, 0, 0, 0, 0, -10,
    -20, -10, -10, -4, -4, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    14, 14, -4, -6, -6, -4, 14, 14,
    18, 28, 10, -4, 0, 10, 30, 18,
  ],
};
const KING_END = [
  -50, -38, -30, -20, -20, -30, -38, -50,
  -30, -18, -10, 0, 0, -10, -18, -30,
  -30, -10, 18, 28, 28, 18, -10, -30,
  -30, -10, 28, 38, 38, 28, -10, -30,
  -30, -10, 28, 38, 38, 28, -10, -30,
  -30, -10, 18, 28, 28, 18, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

/** Static evaluation in centipawns, positive = good for White. */
export function evaluate(b: (Piece | null)[]): number {
  let heavy = 0;
  for (const p of b) if (p && p.t !== "p" && p.t !== "k") heavy += VALUE[p.t];
  const endgame = heavy <= 1500;
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq];
    if (!p) continue;
    const idx = p.c === "w" ? sq : (7 - (sq >> 3)) * 8 + (sq & 7);
    const table = p.t === "k" && endgame ? KING_END : PST[p.t];
    const v = VALUE[p.t] + table[idx];
    score += p.c === "w" ? v : -v;
  }
  return score;
}

/* ---------------- Search ---------------- */

export type Level = "easy" | "medium" | "hard";
export interface SearchResult { from: number; to: number; promo?: PieceType; score: number; depth: number; nodes: number }

const MATE = 100000;
interface Ctx { nodes: number; deadline: number; stop: boolean }
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const sideScore = (s: State) => (s.turn === "w" ? evaluate(s.board) : -evaluate(s.board));

const orderKey = (m: Move) =>
  (m.captured ? 10 * VALUE[m.captured.t] - VALUE[m.piece.t] + 1000 : 0) + (m.promo === "q" ? 900 : 0);
const order = (ms: Move[]) => ms.sort((a, b) => orderKey(b) - orderKey(a));

function quiesce(s: State, alpha: number, beta: number, ctx: Ctx, qd: number): number {
  ctx.nodes++;
  const stand = sideScore(s);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qd <= 0) return alpha;
  for (const m of order(pseudoMoves(s, true))) {
    const ns = makeMove(s, m);
    if (isAttacked(ns.board, findKing(ns.board, s.turn), ns.turn)) continue;
    const v = -quiesce(ns, -beta, -alpha, ctx, qd - 1);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function negamax(s: State, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx, useQ: boolean): number {
  if ((ctx.nodes & 1023) === 0 && now() > ctx.deadline) ctx.stop = true;
  if (ctx.stop) return 0;
  if (depth === 0) return useQ ? quiesce(s, alpha, beta, ctx, 6) : sideScore(s);
  ctx.nodes++;
  let legal = 0;
  for (const m of order(pseudoMoves(s))) {
    const ns = makeMove(s, m);
    if (isAttacked(ns.board, findKing(ns.board, s.turn), ns.turn)) continue;
    legal++;
    const v = -negamax(ns, depth - 1, -beta, -alpha, ply + 1, ctx, useQ);
    if (ctx.stop) return 0;
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  if (!legal) return inCheck(s) ? -MATE + ply : 0;
  if (s.half >= 100) return 0;
  return alpha;
}

const LEVELS: Record<Level, { maxDepth: number; ms: number; noise: number; q: boolean }> = {
  easy: { maxDepth: 1, ms: 300, noise: 140, q: false },
  medium: { maxDepth: 2, ms: 900, noise: 18, q: true },
  hard: { maxDepth: 6, ms: 1600, noise: 0, q: true },
};

export function searchBestMove(s: State, level: Level): SearchResult | null {
  const root = order(legalMoves(s));
  if (!root.length) return null;
  const cfg = LEVELS[level];
  const ctx: Ctx = { nodes: 0, deadline: now() + cfg.ms, stop: false };
  let best = root[0];
  let bestScore = sideScore(s);
  let done = 0;
  let ordered = root;
  for (let d = 1; d <= cfg.maxDepth; d++) {
    let alpha = -Infinity;
    let iterBest = ordered[0];
    let iterScore = -Infinity;
    const scores = new Map<Move, number>();
    for (const m of ordered) {
      // With randomness, score every root move exactly (full window) before adding noise;
      // adding noise to an alpha-beta bound would let weaker moves overtake real ones.
      const v = cfg.noise
        ? -negamax(makeMove(s, m), d - 1, -Infinity, Infinity, 1, ctx, cfg.q) + (Math.random() * 2 - 1) * cfg.noise
        : -negamax(makeMove(s, m), d - 1, -Infinity, -alpha, 1, ctx, cfg.q);
      if (ctx.stop) break;
      scores.set(m, v);
      if (v > iterScore) { iterScore = v; iterBest = m; }
      if (v > alpha) alpha = v;
    }
    if (ctx.stop && done > 0) break; // keep the last completed depth
    best = iterBest;
    bestScore = iterScore;
    done = d;
    // Search the previous best first next time: better pruning.
    ordered = [...ordered].sort((a, b) => (scores.get(b) ?? -Infinity) - (scores.get(a) ?? -Infinity));
    if (ctx.stop || Math.abs(bestScore) > MATE - 200) break;
  }
  return {
    from: best.from,
    to: best.to,
    promo: best.promo,
    score: s.turn === "w" ? bestScore : -bestScore,
    depth: done,
    nodes: ctx.nodes,
  };
}

export const MATE_SCORE = MATE;
