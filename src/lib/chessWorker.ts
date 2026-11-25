/* Runs the chess search off the main thread so animations stay smooth while the computer thinks. */
import { searchBestMove, type Level, type State } from "./chess";

self.onmessage = (e: MessageEvent<{ id: number; state: State; level: Level }>) => {
  const { id, state, level } = e.data;
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage({ id, result: searchBestMove(state, level) });
};
