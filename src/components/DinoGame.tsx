import { ExternalLink, Keyboard, Smartphone } from "lucide-react";

const gameUrl = `${import.meta.env.BASE_URL}dino-game/`;

const DinoGame = () => (
  <section className="min-h-screen w-full px-4 pb-12 pt-24 text-white">
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">YukeshWorks Vault · Arcade</p>
          <h2 className="font-display text-2xl font-bold tracking-wider sm:text-3xl">Chrome Dino</h2>
          <p className="mt-1 text-sm text-white/45">One more run. How far can you go?</p>
        </div>
        <a href={gameUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition hover:border-white/35 hover:bg-white/10 hover:text-white">
          <ExternalLink size={14} /> Open full screen
        </a>
      </header>
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <iframe
          title="Chrome Dino endless runner game"
          src={gameUrl}
          className="block h-[365px] w-full border-0 bg-white sm:h-[390px]"
          loading="eager"
          allow="fullscreen"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55">
        <span className="inline-flex items-center gap-2"><Keyboard size={14} /> Space / ↑ to jump</span>
        <span className="inline-flex items-center gap-2"><Smartphone size={14} /> Tap the game on mobile</span>
        <span>Avoid cacti and birds. Beat your own high score.</span>
      </div>
      <p className="mt-3 text-[10px] leading-5 text-white/30">Game by Karthik Nedunchezhiyan · MIT License · High score is saved locally on this device.</p>
    </div>
  </section>
);

export default DinoGame;
