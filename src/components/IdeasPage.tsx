import { CalendarClock, Github, Images, Instagram, ShieldCheck, Sparkles, Upload, type LucideIcon } from "lucide-react";

/*
 * Ideas: things Yukesh is building. Add a new idea by adding an entry to IDEAS.
 */

type Idea = {
  id: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  status: string;
  accent: string; // "r, g, b"
  summary: string;
  steps: { icon: LucideIcon; title: string; text: string }[];
  highlights: string[];
  stack: string[];
  links: { label: string; href: string; icon: LucideIcon }[];
};

const IDEAS: Idea[] = [
  {
    id: "instagram-auto-poster",
    icon: Instagram,
    title: "Instagram Auto-Poster",
    tagline: "Plan posts once. They go live on time, by themselves.",
    status: "Built · in testing",
    accent: "240, 168, 212",
    summary:
      "A free, open-source scheduler for the BISCUIT art account. Pick photos or videos, write a caption, choose a time, and it publishes to Instagram through Meta's official API. There's no server to pay for, because GitHub's own servers do the posting.",
    steps: [
      { icon: Upload, title: "Drop in the post", text: "Photos, a Reel, a carousel of up to 10, or a Story, plus the caption." },
      { icon: CalendarClock, title: "Pick a time", text: "Any time zone. It checks every 15 minutes and posts when it's due." },
      { icon: Images, title: "It goes live", text: "Then it replies with the Instagram link and files the post away." },
    ],
    highlights: [
      "Uses Meta's official Content Publishing API, not a bot",
      "Only the owner can queue posts, even though the code is public",
      "Never posts twice, even if a run is interrupted",
      "Renews its Instagram access by itself, stored encrypted",
    ],
    stack: ["GitHub Actions", "Node.js", "Meta Graph API", "MIT licence"],
    links: [
      { label: "See the code", href: "https://github.com/YukeshWorks/Biscuit-collection/tree/main/scheduler", icon: Github },
    ],
  },
];

const IdeaCard = ({ idea, index }: { idea: Idea; index: number }) => {
  const Icon = idea.icon;
  const a = idea.accent;
  return (
    <article
      className="relative overflow-hidden rounded-3xl border p-5 sm:p-8"
      style={{
        background: `linear-gradient(155deg, rgba(${a}, 0.08), rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.25))`,
        borderColor: `rgba(${a}, 0.18)`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
        animation: `ideaCardIn 0.8s cubic-bezier(0.16,1,0.3,1) ${0.15 + index * 0.1}s both`,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl"
        style={{ background: `rgba(${a}, 0.16)` }}
      />

      <header className="relative flex flex-wrap items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `rgba(${a}, 0.12)`, boxShadow: `0 0 0 1px rgba(${a}, 0.3)` }}
        >
          <Icon size={22} style={{ color: `rgb(${a})` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{idea.title}</h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: `rgb(${a})`, border: `1px solid rgba(${a}, 0.35)`, background: `rgba(${a}, 0.06)` }}
            >
              {idea.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/60">{idea.tagline}</p>
        </div>
      </header>

      <p className="relative mt-5 max-w-[65ch] text-[15px] leading-relaxed text-white/75">{idea.summary}</p>

      <ol className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {idea.steps.map((s, i) => {
          const StepIcon = s.icon;
          return (
            <li key={s.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: `rgba(${a}, 0.15)`, color: `rgb(${a})` }}
                >
                  {i + 1}
                </span>
                <StepIcon size={15} className="text-white/50" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white/90">{s.title}</h3>
              <p className="mt-1 text-[13px] leading-snug text-white/55">{s.text}</p>
            </li>
          );
        })}
      </ol>

      <ul className="relative mt-6 grid gap-2 sm:grid-cols-2">
        {idea.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-[13px] leading-snug text-white/70">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: `rgb(${a})` }} />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <footer className="relative mt-7 flex flex-wrap items-center justify-between gap-4">
        <ul className="flex flex-wrap gap-1.5" aria-label="Built with">
          {idea.stack.map((t) => (
            <li key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {idea.links.map((l) => {
            const LinkIcon = l.icon;
            return (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: `rgb(${a})`, color: "#160f22", outlineColor: `rgb(${a})` }}
              >
                <LinkIcon size={16} />
                {l.label}
              </a>
            );
          })}
        </div>
      </footer>
    </article>
  );
};

const IdeasPage = () => (
  <section className="page-transition relative min-h-[100svh] bg-background px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 sm:mb-10" style={{ animation: "ideaCardIn 0.8s cubic-bezier(0.16,1,0.3,1) both" }}>
        <p className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.3em] text-primary">
          <Sparkles size={13} /> Ideas
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" style={{ textWrap: "balance" }}>
          Things I'm building
        </h1>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-white/60 sm:text-base">
          Side projects that start as "what if I just automated this?" and end up as real tools.
        </p>
      </div>

      <div className="grid gap-6">
        {IDEAS.map((idea, i) => (
          <IdeaCard key={idea.id} idea={idea} index={i} />
        ))}
      </div>
    </div>

    <style>{`
      @keyframes ideaCardIn {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        article, section > div > div { animation: none !important; }
      }
    `}</style>
  </section>
);

export default IdeasPage;
