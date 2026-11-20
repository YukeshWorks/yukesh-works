import { useCallback, useEffect, useRef, useState } from "react";
import { other, type Color } from "@/lib/chess";
import { openRoom, randomId, type NetLink, type NetMsg, type NetStatus, type Seats } from "@/lib/chessNet";

/*
 * Room logic for online chess.
 * - The creator ("host") owns the seats and gives the free one to the first newcomer;
 *   anyone else who joins the link watches as a spectator.
 * - Everyone keeps the move list; on (re)join, seated players send their state and the
 *   longer consistent history wins, so a refresh or a dropped connection resumes the game.
 * - Each client also stores the room locally, so the same link puts you back in your seat.
 */

type Saved = { me: string; seats: Seats | null; host: string | null; game: number; moves: string[] };
const KEY = (room: string) => `yw-chess-room-${room}`;
export const loadRoom = (room: string): Saved | null => {
  try { return JSON.parse(localStorage.getItem(KEY(room)) || "null") as Saved | null; } catch { return null; }
};
const saveRoom = (room: string, s: Saved) => { try { localStorage.setItem(KEY(room), JSON.stringify(s)); } catch { /* storage blocked */ } };
const setUrlRoom = (id: string | null) => {
  const u = new URL(window.location.href);
  if (id) u.searchParams.set("chess", id); else u.searchParams.delete("chess");
  window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
};
const colorOf = (s: Seats | null, id: string): Color | null => (s?.w === id ? "w" : s?.b === id ? "b" : null);
const isPrefix = (a: string[], b: string[]) => a.length <= b.length && a.every((u, i) => b[i] === u);

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Outgoing = DistOmit<NetMsg, "from">;

export interface NetCallbacks {
  getMoves: () => string[];
  /** Replace the move list (newGame = a rematch started). */
  onSync: (moves: string[], newGame: boolean) => void;
  /** Apply one remote move. "gap" = we are missing earlier moves. */
  onMove: (uci: string, ply: number) => "ok" | "dup" | "gap" | "bad";
  onResign: (color: Color) => void;
  onRematch: () => void;
  onEmote: (e: string, mine: boolean) => void;
  onJoined: (again: boolean) => void;
  onLeft: () => void;
}

export function useChessNet(cb: NetCallbacks) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const [room, setRoom] = useState<string | null>(null);
  const [me, setMe] = useState("");
  const [status, setStatus] = useState<NetStatus | "idle">("idle");
  const [seats, setSeats] = useState<Seats | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [peers, setPeers] = useState<string[]>([]);
  const [rematch, setRematch] = useState<"none" | "sent" | "received">("none");
  const link = useRef<NetLink | null>(null);
  const r = useRef({ room: null as string | null, me: "", seats: null as Seats | null, host: null as string | null, game: 0 });

  const persist = (moves?: string[]) => {
    const x = r.current;
    if (x.room) saveRoom(x.room, { me: x.me, seats: x.seats, host: x.host, game: x.game, moves: moves ?? cbRef.current.getMoves() });
  };
  const send = (m: Outgoing) => link.current?.send({ ...m, from: r.current.me } as NetMsg);
  const applySeats = (s: Seats, h: string) => { r.current.seats = s; r.current.host = h; setSeats(s); setHost(h); };
  const sendState = () => {
    const x = r.current;
    if (x.seats && x.host) send({ t: "state", seats: x.seats, host: x.host, game: x.game, moves: cbRef.current.getMoves() });
  };
  const hello = () => send({ t: "hello", ply: cbRef.current.getMoves().length, game: r.current.game });
  const seatNewcomer = (id: string) => {
    const x = r.current;
    if (!x.seats || x.me !== x.host || id === x.seats.w || id === x.seats.b) return false;
    if (x.seats.w && x.seats.b) return false;
    applySeats(x.seats.w ? { ...x.seats, b: id } : { ...x.seats, w: id }, x.host);
    persist();
    return true;
  };
  const doRematch = () => {
    const x = r.current;
    if (!x.seats || !x.host) return;
    x.game += 1;
    applySeats({ w: x.seats.b, b: x.seats.w }, x.host);
    setRematch("none");
    cbRef.current.onRematch();
    persist([]);
  };

  const handle = (m: NetMsg) => {
    const x = r.current;
    if (m.from === x.me) return;
    switch (m.t) {
      case "hello":
        if (!x.seats) return;
        seatNewcomer(m.from);
        if (colorOf(x.seats, x.me)) sendState();
        break;
      case "state": {
        const local = cbRef.current.getMoves();
        if (!x.seats || m.game > x.game) {
          const newGame = !!x.seats && m.game > x.game;
          x.game = m.game;
          applySeats(m.seats, m.host);
          if (newGame || !isPrefix(m.moves, local) || m.moves.length !== local.length) cbRef.current.onSync(m.moves, newGame);
          if (newGame) setRematch("none");
        } else if (m.game === x.game) {
          if (m.from === x.host || x.me !== x.host) applySeats(m.seats, m.host);
          if (m.moves.length > local.length && isPrefix(local, m.moves)) cbRef.current.onSync(m.moves, false);
          else if (local.length > m.moves.length && isPrefix(m.moves, local)) sendState();
          else if (!isPrefix(local, m.moves) && m.from === x.host) cbRef.current.onSync(m.moves, false);
        } else {
          sendState(); // they are a game behind
        }
        persist();
        break;
      }
      case "move": {
        if (m.game !== x.game) return;
        const res = cbRef.current.onMove(m.uci, m.ply);
        if (res === "gap" || res === "bad") hello();
        else persist();
        break;
      }
      case "resign":
        if (m.game === x.game) cbRef.current.onResign(m.color);
        break;
      case "rematch-offer":
        if (m.game === x.game) setRematch("received");
        break;
      case "rematch-accept":
        if (m.game === x.game) doRematch();
        break;
      case "emote":
        cbRef.current.onEmote(m.e.slice(0, 4), false);
        break;
    }
  };
  const handleRef = useRef(handle);
  handleRef.current = handle;

  const connect = useCallback(async (roomId: string, myId: string) => {
    link.current?.close();
    link.current = null;
    setStatus("connecting");
    const l = await openRoom(roomId, myId, {
      onMessage: m => handleRef.current(m),
      onPeers: ids => setPeers(ids),
      onStatus: st => { setStatus(st); if (st === "online" || st === "local") window.setTimeout(() => helloRef.current(), 50); },
    });
    if (r.current.room !== roomId) { l.close(); return; }
    link.current = l;
  }, []);
  const helloRef = useRef(hello);
  helloRef.current = hello;

  // When someone appears in the room, the host seats them and seated players share state.
  const knownPeers = useRef(new Set<string>());
  useEffect(() => {
    const fresh = peers.filter(id => !knownPeers.current.has(id));
    knownPeers.current = new Set(peers);
    if (!fresh.length) return;
    fresh.forEach(id => { if (id !== r.current.me) seatNewcomer(id); });
    if (colorOf(r.current.seats, r.current.me)) sendState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peers]);

  const create = (color: Color | "random") => {
    const roomId = randomId(8), myId = randomId(10);
    const c: Color = color === "random" ? (Math.random() < 0.5 ? "w" : "b") : color;
    const s: Seats = c === "w" ? { w: myId, b: null } : { w: null, b: myId };
    r.current = { room: roomId, me: myId, seats: s, host: myId, game: 0 };
    knownPeers.current = new Set();
    setRoom(roomId); setMe(myId); setSeats(s); setHost(myId); setRematch("none"); setPeers([]);
    saveRoom(roomId, { me: myId, seats: s, host: myId, game: 0, moves: [] });
    setUrlRoom(roomId);
    void connect(roomId, myId);
    return c;
  };
  const join = (roomId: string) => {
    const saved = loadRoom(roomId);
    const myId = saved?.me ?? randomId(10);
    r.current = { room: roomId, me: myId, seats: saved?.seats ?? null, host: saved?.host ?? null, game: saved?.game ?? 0 };
    knownPeers.current = new Set();
    setRoom(roomId); setMe(myId); setSeats(saved?.seats ?? null); setHost(saved?.host ?? null); setRematch("none"); setPeers([]);
    if (!saved) saveRoom(roomId, { me: myId, seats: null, host: null, game: 0, moves: [] });
    setUrlRoom(roomId);
    void connect(roomId, myId);
    return saved;
  };
  const leave = () => {
    link.current?.close();
    link.current = null;
    r.current = { room: null, me: "", seats: null, host: null, game: 0 };
    setRoom(null); setStatus("idle"); setSeats(null); setHost(null); setPeers([]); setRematch("none");
    setUrlRoom(null);
  };
  useEffect(() => () => link.current?.close(), []);

  const myColor = colorOf(seats, me);
  const opponentId = myColor && seats ? seats[other(myColor)] : null;
  const opponentOnline = !!opponentId && peers.includes(opponentId);
  const spectators = peers.filter(id => id !== seats?.w && id !== seats?.b).length;

  // Tell the game when the opponent arrives, comes back, or drops.
  const seenOpp = useRef<string | null>(null);
  const wasOnline = useRef(false);
  useEffect(() => {
    if (opponentOnline && !wasOnline.current) {
      cbRef.current.onJoined(seenOpp.current === opponentId);
      seenOpp.current = opponentId;
    } else if (!opponentOnline && wasOnline.current) {
      cbRef.current.onLeft();
    }
    wasOnline.current = opponentOnline;
  }, [opponentOnline, opponentId]);

  return {
    room, me, status, seats, host, peers, myColor, opponentId, opponentOnline, spectators, rematch,
    kind: link.current?.kind ?? null,
    create, join, leave,
    sendMove: (uci: string, ply: number) => { send({ t: "move", uci, ply, game: r.current.game }); window.setTimeout(() => persist(), 0); },
    resign: (color: Color) => send({ t: "resign", color, game: r.current.game }),
    offerRematch: () => {
      if (rematch === "received") { send({ t: "rematch-accept", game: r.current.game }); doRematch(); }
      else { send({ t: "rematch-offer", game: r.current.game }); setRematch("sent"); }
    },
    emote: (e: string) => { send({ t: "emote", e }); cbRef.current.onEmote(e, true); },
  };
}
