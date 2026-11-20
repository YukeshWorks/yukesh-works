import { createContext } from "react";

export type PieceSet = "royal" | "classic" | "neon";
export const PIECE_SETS: { id: PieceSet; label: string }[] = [
  { id: "royal", label: "Royal" },
  { id: "classic", label: "Classic" },
  { id: "neon", label: "Neon" },
];
export const PieceSetContext = createContext<PieceSet>("royal");
