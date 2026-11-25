/*
 * Online chess transport. Messages travel over a Supabase Realtime broadcast channel
 * (no database tables involved); presence tells who is in the room. If Supabase is not
 * available, a BroadcastChannel fallback lets two tabs of the same browser play, which
 * is also what `?net=local` forces for testing.
 *
 * Every client validates moves with its own rules engine, so a bad message can't
 * produce an illegal position.
 */

import type { Color } from "./chess";

export type Seats = { w: string | null; b: string | null };
export type NetMsg =
  | { t: "hello"; from: string; ply: number; game: number }
  | { t: "state"; from: string; seats: Seats; host: string; game: number; moves: string[] }
  | { t: "move"; from: string; uci: string; ply: number; game: number }
  | { t: "resign"; from: string; color: Color; game: number }
  | { t: "rematch-offer"; from: string; game: number }
  | { t: "rematch-accept"; from: string; game: number }
  | { t: "emote"; from: string; e: string };

export type NetStatus = "connecting" | "online" | "local" | "error";
export interface NetLink { kind: "supabase" | "local"; send: (m: NetMsg) => void; close: () => void }
interface Handlers { onMessage: (m: NetMsg) => void; onPeers: (ids: string[]) => void; onStatus: (s: NetStatus) => void }

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const randomId = (n = 8) => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join("");
};
export const isRoomId = (s: string) => /^[a-z0-9]{6,16}$/.test(s);

export async function openRoom(room: string, me: string, h: Handlers): Promise<NetLink> {
  const forceLocal = new URLSearchParams(window.location.search).get("net") === "local";
  if (!forceLocal) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const ch = supabase.channel(`yw-chess-${room}`, { config: { broadcast: { self: false, ack: false }, presence: { key: me } } });
      ch.on("broadcast", { event: "m" }, ({ payload }) => h.onMessage(payload as NetMsg));
      ch.on("presence", { event: "sync" }, () => h.onPeers(Object.keys(ch.presenceState())));
      h.onStatus("connecting");
      ch.subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await ch.track({ at: Date.now() });
          h.onStatus("online");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          h.onStatus("error");
        }
      });
      return {
        kind: "supabase",
        send: m => { void ch.send({ type: "broadcast", event: "m", payload: m }); },
        close: () => { void supabase.removeChannel(ch); },
      };
    } catch {
      /* fall back to same-device play below */
    }
  }

  const bc = new BroadcastChannel(`yw-chess-${room}`);
  const seen = new Map<string, number>();
  const report = () => {
    const now = Date.now();
    seen.forEach((t, id) => { if (now - t > 6000) seen.delete(id); });
    h.onPeers([me, ...seen.keys()]);
  };
  bc.onmessage = (e: MessageEvent<NetMsg | { t: "__hb"; from: string }>) => {
    const m = e.data;
    const fresh = !seen.has(m.from);
    seen.set(m.from, Date.now());
    if (fresh) report();
    if (m.t !== "__hb") h.onMessage(m);
  };
  const beat = () => bc.postMessage({ t: "__hb", from: me });
  beat();
  const hb = window.setInterval(() => { beat(); report(); }, 2000);
  window.setTimeout(() => h.onStatus("local"), 0);
  return {
    kind: "local",
    send: m => bc.postMessage(m),
    close: () => { window.clearInterval(hb); bc.close(); },
  };
}
