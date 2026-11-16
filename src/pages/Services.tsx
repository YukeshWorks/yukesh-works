import { ArrowLeft, ArrowRight, ArrowUpRight, Check, FileText, Image as ImageIcon, Mail, MessageCircle, QrCode, Smartphone, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

const whatsappUrl = "https://wa.me/919080861733?text=Hi%20YukeshWorks%2C%20I%20want%20to%20enquire%20about%20your%20digital%20services.";

const sampleAssets = {
  resume: `${import.meta.env.BASE_URL}samples/resume-demo.html`,
  poster: `${import.meta.env.BASE_URL}samples/cafe-poster.svg`,
  qr: `${import.meta.env.BASE_URL}samples/cafe-menu-qr.png`,
  menu: `${import.meta.env.BASE_URL}samples/cafe-menu.html`,
};

const Services = () => (
  <main className="min-h-screen bg-[#080d0d] text-slate-100 selection:bg-emerald-300 selection:text-slate-950">
    <div className="pointer-events-none fixed inset-0 opacity-30" aria-hidden="true">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
    </div>
    <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-7 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
        <RouterLink to="/" className="font-heading text-sm font-extrabold tracking-[0.24em] text-white">YUKES<span className="text-emerald-300">H</span>WORKS</RouterLink>
        <RouterLink to="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-emerald-300/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to portfolio</RouterLink>
      </header>
      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200"><Sparkles className="h-3.5 w-3.5" /> Pilot services · Coimbatore + remote</div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">Small digital jobs.<br /><span className="text-emerald-300">Done with care.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">Clean resumes, simple promotional designs and mobile-friendly digital menus for students and small businesses. Clear scope and pricing before work begins.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-200"><MessageCircle className="h-4 w-4" /> Ask about a project</a>
            <a href="mailto:mailtoyukesh33@gmail.com?subject=YukeshWorks%20project%20enquiry" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-white/35"><Mail className="h-4 w-4" /> Email</a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Pilot pricing. No paid tools or domain purchase required to enquire.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Simple starting prices</div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-sm text-slate-200">Resume formatting</span><b className="text-xl text-emerald-200">₹149</b></div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-sm text-slate-200">Social media poster</span><b className="text-xl text-emerald-200">₹149</b></div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-sm text-slate-200">QR digital menu</span><b className="text-xl text-emerald-200">₹299</b></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-200">One-page website</span><b className="text-xl text-emerald-200">From ₹799</b></div>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">Final price depends on agreed content, deadline and scope. Domain registration, paid hosting, stock assets and extra revisions are quoted separately.</p>
        </div>
      </section>
      <section className="border-t border-white/10 pt-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">Work samples</p><h2 className="mt-2 text-3xl font-extrabold">See the format first.</h2></div><span className="rounded-full border border-amber-200/20 bg-amber-200/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100">All demos are fictional</span></div>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"><div className="flex h-64 items-center justify-center overflow-hidden bg-slate-100 p-3"><iframe title="Fictional resume sample preview" src={sampleAssets.resume} className="h-full w-full rounded-lg bg-white" loading="lazy" sandbox="" /></div><div className="p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200"><FileText className="h-4 w-4" /> Resume formatting</div><p className="mt-2 text-sm leading-6 text-slate-300">A neat, readable one-page structure using example details only.</p><a href={sampleAssets.resume} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">Open sample <ArrowUpRight className="h-4 w-4" /></a></div></article>
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"><div className="flex h-64 items-center justify-center overflow-hidden bg-[#f0e5d2] p-3"><img src={sampleAssets.poster} alt="Copper Cup fictional café poster demo" className="h-full max-w-full rounded-lg object-contain shadow-lg" loading="lazy" /></div><div className="p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200"><ImageIcon className="h-4 w-4" /> Promotional poster</div><p className="mt-2 text-sm leading-6 text-slate-300">A sample café promotion with fictional menu items and prices.</p><a href={sampleAssets.poster} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">Open poster <ArrowUpRight className="h-4 w-4" /></a></div></article>
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"><div className="flex h-64 items-center justify-center gap-4 overflow-hidden bg-[#f7f1e6] p-5"><img src={sampleAssets.qr} alt="QR code for the fictional Copper Cup sample menu" className="w-32 rounded-lg bg-white p-2 shadow-md" loading="lazy" /><div className="max-w-[120px] text-xs leading-5 text-[#294632]"><QrCode className="mb-2 h-6 w-6" /><b>Scan to view menu</b><br />Fictional café demo</div></div><div className="p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200"><Smartphone className="h-4 w-4" /> QR digital menu</div><p className="mt-2 text-sm leading-6 text-slate-300">A mobile-friendly menu page with grouped items and sample prices.</p><a href={sampleAssets.menu} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">Open menu <ArrowUpRight className="h-4 w-4" /></a></div></article>
        </div>
        <p className="mt-4 text-xs leading-6 text-slate-500">The QR sample uses the existing portfolio host path. Scan-test it after deployment and replace the destination with the final live domain before using it for a paying business.</p>
      </section>
      <section className="mt-14 grid gap-7 rounded-3xl border border-emerald-200/15 bg-emerald-300/[0.07] p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">How it works</p><h2 className="mt-2 text-2xl font-extrabold">Clear brief. Clear delivery.</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" /> Confirm scope and price</div><div className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" /> Review one draft</div><div className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" /> Receive final files</div></div></div><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:-translate-y-0.5">Start an enquiry <ArrowRight className="h-4 w-4" /></a></section>
      <footer className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} YukeshWorks · Built by Yukesh Kumar</span><RouterLink to="/" className="inline-flex items-center gap-1 hover:text-white">Back to home <ArrowUpRight className="h-3.5 w-3.5" /></RouterLink></footer>
      <p className="mt-4 text-[10px] leading-5 text-slate-600">Samples use fictional identities, business names and prices. Customer-provided information must be checked and approved before final delivery. Results such as sales or customer growth are not guaranteed.</p>
    </div>
  </main>
);

export default Services;
