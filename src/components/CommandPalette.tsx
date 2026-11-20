import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, ShieldHalf, User, Briefcase, Joystick, Worm, Sparkles, Brain, TreePalm, Footprints, Rocket,
  Palette, KeyRound, Mail, MessageCircle, Send, Instagram, Linkedin, Trophy, Search, Command, CornerDownLeft, Lock,
} from "lucide-react";
import { ACHIEVEMENTS, getUnlocked, navigate, onUnlock, trackTheme, unlock, type GameId } from "@/lib/siteEvents";

/*
 * Ctrl/⌘+K or "/" (or the floating button) opens a palette to jump anywhere,
 * launch any game, switch theme, reach out, or browse achievements.
 */

type Item = { id: string; group: string; label: string; hint?: string; icon: typeof Home; keywords?: string; run: () => void };

const EMAIL = "mailtoyukesh33@gmail.com";

const setTheme = (t: "blue" | "red" | "dark") => {
  const r = document.documentElement;
  r.classList.remove("theme-blue", "theme-red", "theme-dark");
  r.classList.add(`theme-${t}`);
  try { localStorage.setItem("portfolio-theme", t); } catch { /* storage blocked */ }
  trackTheme(t);
};

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"commands" | "trophies">("commands");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState("");
  const [unlocked, setUnlocked] = useState(getUnlocked);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const routerNavigate = useNavigate();

  useEffect(() => onUnlock(() => setUnlocked(getUnlocked())), []);

  const close = () => { setOpen(false); setQuery(""); setActive(0); setView("commands"); };
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 1600); };

  const items: Item[] = useMemo(() => {
    const go = (fn: () => void) => () => { close(); window.setTimeout(fn, 120); };
    const game = (id: GameId) => go(() => { routerNavigate("/"); navigate({ kind: "game", game: id }); });
    const ext = (url: string) => go(() => window.open(url, "_blank", "noopener,noreferrer"));
    return [
      { id: "home", group: "Go to", label: "Home", icon: Home, run: go(() => { routerNavigate("/"); navigate({ kind: "tab", tab: "home" }); }) },
      { id: "vault", group: "Go to", label: "Vault", icon: ShieldHalf, keywords: "games lamp", run: go(() => { routerNavigate("/"); navigate({ kind: "tab", tab: "puzzle" }); }) },
      { id: "about", group: "Go to", label: "About me", icon: User, keywords: "info profile", run: go(() => { routerNavigate("/"); navigate({ kind: "tab", tab: "info" }); }) },
      { id: "services", group: "Go to", label: "Digital Services", icon: Briefcase, keywords: "hire work pricing", run: go(() => routerNavigate("/services")) },
      { id: "games", group: "Go to", label: "Games menu", icon: Joystick, run: go(() => { routerNavigate("/"); navigate({ kind: "games-menu" }); }) },
      { id: "g-snake", group: "Play", label: "Snake Glide", icon: Worm, run: game("snake") },
      { id: "g-scratch", group: "Play", label: "Rainbow Scratch", icon: Sparkles, run: game("scratch") },
      { id: "g-memory", group: "Play", label: "Memory Match", icon: Brain, run: game("memory") },
      { id: "g-island", group: "Play", label: "Island Creator", icon: TreePalm, run: game("island") },
      { id: "g-orbit", group: "Play", label: "Orbit Forge", icon: Rocket, keywords: "rocket space", run: game("orbit") },
      { id: "g-dino", group: "Play", label: "Chrome Dino", icon: Footprints, run: game("dino") },
      { id: "t-blue", group: "Theme", label: "Theme: Ice", icon: Palette, keywords: "blue colour color", run: go(() => setTheme("blue")) },
      { id: "t-red", group: "Theme", label: "Theme: Fire", icon: Palette, keywords: "red colour color", run: go(() => setTheme("red")) },
      { id: "t-dark", group: "Theme", label: "Theme: Void", icon: Palette, keywords: "dark grey colour color", run: go(() => setTheme("dark")) },
      { id: "copy-mail", group: "Reach out", label: "Copy email address", hint: EMAIL, icon: Mail, keywords: "contact",
        run: () => { void navigator.clipboard?.writeText(EMAIL).then(() => flash("Email copied ✓"), () => flash(EMAIL)); } },
      { id: "wa", group: "Reach out", label: "WhatsApp", icon: MessageCircle, keywords: "chat contact", run: ext("https://wa.me/918189936361") },
      { id: "tg", group: "Reach out", label: "Telegram", icon: Send, keywords: "chat contact", run: ext("https://t.me/Yukesh_tg") },
      { id: "ig", group: "Reach out", label: "Instagram", icon: Instagram, run: ext("https://instagram.com/yuk3shh") },
      { id: "li", group: "Reach out", label: "LinkedIn", icon: Linkedin, run: ext("https://www.linkedin.com/in/yukesh-kumar-a01647322") },
      { id: "trophies", group: "Secrets", label: "Achievements", hint: `${Object.keys(getUnlocked()).length}/${ACHIEVEMENTS.length}`, icon: Trophy, keywords: "trophy badges",
        run: () => { setView("trophies"); setQuery(""); } },
      { id: "lock", group: "Secrets", label: "Open the vault door", icon: KeyRound, keywords: "code password secret agent", run: go(() => { routerNavigate("/"); navigate({ kind: "lock" }); }) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerNavigate, unlocked]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items
      .map(i => {
        const hay = `${i.label} ${i.group} ${i.keywords ?? ""}`.toLowerCase();
        const score = i.label.toLowerCase().startsWith(q) ? 3 : hay.includes(q) ? 2 : q.split("").every(c => hay.includes(c)) ? 1 : 0;
        return { i, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.i);
  }, [items, query]);

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o); return; }
      if (e.key === "/" && !typing && !open) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Let games know the keyboard belongs to the palette (and pause them).
  useEffect(() => {
    document.body.dataset.palette = open ? "open" : "";
    if (open) window.dispatchEvent(new Event("yw:palette-open"));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    unlock("power-user");
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open, view]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); if (view === "trophies") setView("commands"); else close(); return; }
    if (view !== "commands") return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(filtered.length - 1, a + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    if (e.key === "Enter") { e.preventDefault(); filtered[active]?.run(); }
  };

  const unlockedCount = Object.keys(unlocked).length;
  let lastGroup = "";

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="fixed top-24 right-4 z-[60] h-10 pl-3 pr-3 md:pr-2 rounded-xl flex items-center gap-2 text-white/60 hover:text-white bg-black/50 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all duration-300 hover:scale-105"
        style={{ animation: "cpBtnIn 0.8s cubic-bezier(0.16,1,0.3,1) 1.2s both" }}
      >
        <Search size={15} />
        <span className="hidden md:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10"><Command size={10} />K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-[12vh] px-4" onMouseDown={close} style={{ animation: "cpFade 0.2s ease-out both" }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            onMouseDown={e => e.stopPropagation()}
            role="dialog"
            aria-label="Command palette"
            style={{
              background: "linear-gradient(180deg, rgba(22,22,28,0.97), rgba(12,12,16,0.97))",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.12)",
              animation: "cpIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div className="flex items-center gap-3 px-4 border-b border-white/10">
              {view === "trophies" ? <Trophy size={16} className="text-amber-300" /> : <Search size={16} className="text-white/40" />}
              <input
                ref={inputRef}
                autoFocus
                value={view === "trophies" ? "" : query}
                readOnly={view === "trophies"}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder={view === "trophies" ? `Achievements · ${unlockedCount}/${ACHIEVEMENTS.length} unlocked (Esc to go back)` : "Where to? Try “snake”, “theme”, “email”…"}
                className="flex-1 h-14 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
                aria-label="Search commands"
              />
              <kbd className="text-[10px] font-mono text-white/40 px-1.5 py-0.5 rounded border border-white/15">Esc</kbd>
            </div>

            {view === "commands" ? (
              <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
                {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-white/40">Nothing matches “{query}”.</p>}
                {filtered.map((item, idx) => {
                  const header = item.group !== lastGroup ? item.group : null;
                  lastGroup = item.group;
                  const Icon = item.icon;
                  const on = idx === active;
                  return (
                    <div key={item.id}>
                      {header && <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{header}</p>}
                      <button
                        type="button"
                        data-idx={idx}
                        onMouseMove={() => setActive(idx)}
                        onClick={item.run}
                        className="relative w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                        style={{ background: on ? "hsl(var(--primary) / 0.12)" : "transparent", color: on ? "white" : "rgba(255,255,255,0.7)" }}
                      >
                        {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />}
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.05] border border-white/10" style={{ color: on ? "hsl(var(--primary))" : undefined }}>
                          <Icon size={15} />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {item.hint && <span className="text-[11px] text-white/35">{item.hint}</span>}
                        {on && <CornerDownLeft size={13} className="text-white/40" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-h-[56vh] overflow-y-auto p-3 grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.map((a, i) => {
                  const got = Boolean(unlocked[a.id]);
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl p-3 flex items-start gap-2.5 border"
                      style={{
                        background: got ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)",
                        borderColor: got ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.08)",
                        animation: `cpTrophy 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.03}s both`,
                      }}
                    >
                      <span className="text-xl leading-none" style={{ filter: got ? "none" : "grayscale(1) brightness(0.5)" }}>{got ? a.icon : <Lock size={18} className="text-white/30" />}</span>
                      <span>
                        <span className={`block text-xs font-bold ${got ? "text-white" : "text-white/50"}`}>{a.title}</span>
                        <span className="block text-[10px] text-white/40 leading-snug mt-0.5">{a.hint}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-[10px] text-white/35">
              <span className="flex items-center gap-1.5"><Trophy size={11} className="text-amber-300/80" /> {unlockedCount}/{ACHIEVEMENTS.length} achievements</span>
              <span className="hidden sm:inline">↑↓ to move · Enter to open</span>
              {toast && <span className="text-emerald-300">{toast}</span>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cpFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cpIn { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes cpBtnIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: none; } }
        @keyframes cpTrophy { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </>
  );
};

export default CommandPalette;
