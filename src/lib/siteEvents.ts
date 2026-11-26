/*
 * Tiny site-wide event channel + achievements store.
 * - navigate(): the command palette asks Index/VaultPage to change page or open a game.
 * - unlock(): any component can award an achievement; toasts and the palette listen.
 * Progress lives in localStorage (per browser) and fails quietly if storage is blocked.
 */

export type Tab = "home" | "puzzle" | "ideas" | "info";
export type GameId = "snake" | "scratch" | "memory" | "island" | "dino" | "orbit" | "chess";

export type NavRequest =
  | { kind: "tab"; tab: Tab }
  | { kind: "game"; game: GameId }
  | { kind: "games-menu" }
  | { kind: "lock" };

const NAV_EVENT = "yw:navigate";
const UNLOCK_EVENT = "yw:achievement";

// The latest request is also kept until a page handles it, so a request made while the
// target page is still loading (or not mounted yet) is not lost.
let pending: NavRequest | null = null;
export const navigate = (req: NavRequest) => {
  pending = req;
  window.dispatchEvent(new CustomEvent<NavRequest>(NAV_EVENT, { detail: req }));
};
export const peekPending = () => pending;
export const clearPending = () => { pending = null; };
export const takePending = (kinds: NavRequest["kind"][]) => {
  if (pending && kinds.includes(pending.kind)) { const p = pending; pending = null; return p; }
  return null;
};
export const onNavigate = (fn: (r: NavRequest) => void) => {
  const h = (e: Event) => fn((e as CustomEvent<NavRequest>).detail);
  window.addEventListener(NAV_EVENT, h);
  return () => window.removeEventListener(NAV_EVENT, h);
};

/* ---------- Achievements ---------- */

export type AchievementId =
  | "tourist" | "night-owl" | "forty-two" | "agent" | "snake-10" | "total-recall"
  | "treasure" | "architect" | "explorer" | "power-user" | "shapeshifter" | "chess-win" | "grandmaster" | "netplay" | "completionist";

export const ACHIEVEMENTS: { id: AchievementId; icon: string; title: string; hint: string }[] = [
  { id: "tourist", icon: "🧭", title: "Tourist", hint: "Visit Home, Vault and About" },
  { id: "power-user", icon: "⌨️", title: "Power User", hint: "Open the command palette" },
  { id: "shapeshifter", icon: "🎨", title: "Shapeshifter", hint: "Try every colour theme" },
  { id: "forty-two", icon: "🌌", title: "Don't Panic", hint: "Find out what 42 hides" },
  { id: "agent", icon: "🕶️", title: "Welcome, Agent", hint: "Crack the vault code" },
  { id: "explorer", icon: "🕹️", title: "Arcade Explorer", hint: "Open every game in the Vault" },
  { id: "snake-10", icon: "🐍", title: "Snake Charmer", hint: "Score 10 in Snake Glide" },
  { id: "total-recall", icon: "🧠", title: "Total Recall", hint: "Win Memory Match with 3 stars" },
  { id: "treasure", icon: "🌈", title: "Treasure Hunter", hint: "Reveal the rainbow" },
  { id: "architect", icon: "🏝️", title: "Island Architect", hint: "Place 10 things on your island" },
  { id: "chess-win", icon: "♟️", title: "Checkmate", hint: "Beat the computer at chess" },
  { id: "grandmaster", icon: "👑", title: "Grandmaster", hint: "Beat the computer on Hard" },
  { id: "netplay", icon: "🌐", title: "Long Distance", hint: "Play chess online with a friend" },
  { id: "night-owl", icon: "🦉", title: "Night Owl", hint: "Visit between midnight and 5 am" },
  { id: "completionist", icon: "🏆", title: "Completionist", hint: "Unlock everything else" },
];

const KEY = "yw-achievements";
const PROGRESS_KEY = "yw-progress";

const read = <T,>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

export const getUnlocked = (): Record<string, number> => read(KEY, {});

export const unlock = (id: AchievementId) => {
  const got = getUnlocked();
  if (got[id]) return;
  got[id] = Date.now();
  write(KEY, got);
  window.dispatchEvent(new CustomEvent(UNLOCK_EVENT, { detail: id }));
  const others = ACHIEVEMENTS.filter(a => a.id !== "completionist");
  if (id !== "completionist" && others.every(a => got[a.id])) window.setTimeout(() => unlock("completionist"), 1800);
};

export const onUnlock = (fn: (id: AchievementId) => void) => {
  const h = (e: Event) => fn((e as CustomEvent<AchievementId>).detail);
  window.addEventListener(UNLOCK_EVENT, h);
  return () => window.removeEventListener(UNLOCK_EVENT, h);
};

/** Record that something was seen; unlock when a set is complete. */
const track = (bucket: string, item: string, all: string[], reward: AchievementId) => {
  const p = read<Record<string, string[]>>(PROGRESS_KEY, {});
  const seen = new Set(p[bucket] ?? []);
  if (seen.has(item)) return;
  seen.add(item);
  p[bucket] = [...seen];
  write(PROGRESS_KEY, p);
  if (all.every(x => seen.has(x))) unlock(reward);
};

export const trackTab = (tab: Tab) => track("tabs", tab, ["home", "puzzle", "info"], "tourist");
export const trackGame = (game: GameId) => track("games", game, ["snake", "scratch", "memory", "island", "dino", "orbit", "chess"], "explorer");
export const trackTheme = (theme: string) => track("themes", theme, ["blue", "red", "dark"], "shapeshifter");
