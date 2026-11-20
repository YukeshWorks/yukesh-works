import { describe, expect, it } from "vitest";
import { START_FEN, legalMoves, makeMove, outcome, parseFEN, perft, positionKey, searchBestMove, sqName, toSAN } from "@/lib/chess";

// Reference node counts from the standard perft suite.
const CASES: [string, string, number[]][] = [
  ["start", START_FEN, [20, 400, 8902]],
  ["kiwipete", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", [48, 2039, 97862]],
  ["pos3 (en passant, pins)", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", [14, 191, 2812, 43238]],
  ["pos4 (promotions, castling)", "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", [6, 264, 9467]],
  ["pos5", "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", [44, 1486, 62379]],
];

describe("chess move generation (perft)", () => {
  for (const [name, fen, counts] of CASES) {
    it(name, () => {
      const s = parseFEN(fen);
      counts.forEach((n, i) => expect(perft(s, i + 1)).toBe(n));
    });
  }
});

const play = (fen: string, sans: string[]) => {
  let s = parseFEN(fen);
  const keys = [positionKey(s)];
  for (const san of sans) {
    const m = legalMoves(s).find(x => toSAN(s, x).replace(/[+#]/, "") === san.replace(/[+#]/, ""));
    if (!m) throw new Error(`illegal ${san}`);
    s = makeMove(s, m);
    keys.push(positionKey(s));
  }
  return { s, keys };
};

describe("game rules", () => {
  it("detects fool's mate", () => {
    const { s, keys } = play(START_FEN, ["f3", "e5", "g4", "Qh4"]);
    expect(outcome(s, keys)).toEqual({ kind: "checkmate", winner: "b" });
  });
  it("writes SAN with check, mate and castling", () => {
    const s = parseFEN("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const sans = legalMoves(s).map(m => toSAN(s, m));
    expect(sans).toContain("O-O");
    expect(sans).toContain("O-O-O");
    expect(sans).toContain("Rxa8+");
    const mate = parseFEN("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1");
    expect(legalMoves(mate).map(m => toSAN(mate, m))).toContain("Rd8#");
  });
  it("detects stalemate and threefold repetition", () => {
    const st = parseFEN("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(outcome(st, [positionKey(st)])).toEqual({ kind: "stalemate" });
    const { s, keys } = play(START_FEN, ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]);
    expect(outcome(s, keys)).toEqual({ kind: "repetition" });
  });
  it("detects insufficient material", () => {
    const s = parseFEN("8/8/4k3/8/8/2N5/4K3/8 w - - 0 1");
    expect(outcome(s, [positionKey(s)])).toEqual({ kind: "insufficient" });
  });
});

describe("computer player", () => {
  it("finds mate in one", () => {
    const s = parseFEN("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1");
    const r = searchBestMove(s, "medium")!;
    expect(sqName(r.from) + sqName(r.to)).toBe("d1d8");
  });
  it("takes a free queen", () => {
    const s = parseFEN("4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1");
    const r = searchBestMove(s, "hard")!;
    expect(sqName(r.to)).toBe("d5");
  });
});
