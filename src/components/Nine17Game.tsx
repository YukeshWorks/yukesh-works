import { Download, ExternalLink, Headphones, Smartphone } from "lucide-react";

const gameUrl = `${import.meta.env.BASE_URL}the-917/`;
const zipUrl = `${import.meta.env.BASE_URL}the-917/the-917.zip`;

const Nine17Game = () => (
  <section className="relative min-h-screen w-full px-4 pb-12 pt-36 md:pt-24 text-white overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#12262a_0%,#040606_60%)]" />
    <div className="absolute top-1/4 right-1/5 w-72 h-72 bg-teal-300/10 rounded-full blur-3xl animate-float-slow" />
    <div className="relative mx-auto w-full max-w-5xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 fade-in-up">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">YukeshWorks Vault · Horror</p>
          <h2 className="font-display text-2xl font-bold tracking-wider sm:text-3xl">The 9:17</h2>
          <p className="mt-1 text-sm text-white/45">A ghost girl waits for a train that never comes. Find her ticket. Don't look at the conductor.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={zipUrl} download="the-917.zip" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:border-white/30 hover:text-white">
            <Download size={13} /> Download
          </a>
          <a href={gameUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition hover:border-white/35 hover:bg-white/10 hover:text-white">
            <ExternalLink size={14} /> Open full screen
          </a>
        </div>
      </header>
      <div className="fade-in-up delay-200" style={{ opacity: 0 }}>
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-teal-200/20 bg-black shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <iframe
            title="The 9:17 horror mystery game"
            src={gameUrl}
            className="block h-[82vh] min-h-[600px] w-full border-0 bg-black"
            loading="lazy"
            allow="fullscreen; autoplay"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55 fade-in-up delay-300" style={{ opacity: 0 }}>
        <span className="inline-flex items-center gap-2"><Headphones size={14} /> Sound on, lights off · about 15 minutes</span>
        <span className="inline-flex items-center gap-2"><Smartphone size={14} /> Made for phones: open full screen for the best view</span>
      </div>
      <p className="mt-3 text-center text-[10px] leading-5 text-white/30">Download: unzip and open index.html in a browser. Fonts load from the web; progress is saved on this device.</p>
    </div>
  </section>
);

export default Nine17Game;
