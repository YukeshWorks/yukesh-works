import { Download, Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import icon from "@/assets/blink/icon.png";
import shotPlan from "@/assets/blink/plan.jpg";
import shotBuddy from "@/assets/blink/buddy.jpg";
import shotGym from "@/assets/blink/gym.jpg";

const APK_URL = `${import.meta.env.BASE_URL}downloads/BL1NK.apk`;
const VERSION = "1.2";
const SIZE = "24.1 MB";

const features = [
  { title: "Your day, in focus", text: "Schedule, college timetable, calendar and reminders that pop up over any app." },
  { title: "3D buddy", text: "A living anime companion that walks, blinks, eats ice cream, blows balloons and reacts to your day." },
  { title: "Gym, food, sleep", text: "Workout library, meals, water and sleep tracking with gentle nudges." },
  { title: "Screen-time buddy", text: "Pick apps to watch. Scroll past your limit and she pops up over Instagram, angry, telling you to swipe it away." },
];

const BlinkAppPage = () => (
  <section className="min-h-[100svh] page-transition bg-background pt-24 pb-16 px-5">
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <img src={icon} alt="BL1NK app icon" className="w-16 h-16 rounded-2xl shadow-lg" />
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground">BL1NK</h1>
              <p className="text-sm text-muted-foreground">Android · version {VERSION} · {SIZE}</p>
            </div>
          </div>
          <p className="mt-5 text-lg text-foreground/80 max-w-xl">
            Your day in one place, with a 3D buddy who lives in the app and keeps you on track.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={APK_URL}
              download="BL1NK.apk"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Download className="w-5 h-5" /> Download APK
            </a>
            <span className="text-xs text-muted-foreground">Free · no account needed</span>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-foreground/75">
            <div className="flex gap-2"><Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> Android 8.0 or newer.</div>
            <div className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> Installing outside the Play Store: open the file, then allow "Install unknown apps" for your browser when Android asks.</div>
            <div className="flex gap-2"><Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> Tap the 🫧 button in the app to meet your buddy.</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-0">
          {[shotPlan, shotBuddy, shotGym].map((src, i) => (
            <img key={i} src={src} alt={["BL1NK plan screen", "BL1NK 3D buddy", "Buddy cheering for gym time"][i]}
              loading="lazy" className="w-full rounded-2xl border border-white/10 shadow-xl" style={{ marginTop: i === 1 ? 0 : 24 }} />
          ))}
        </div>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-display text-base font-semibold text-foreground">{f.title}</h2>
            <p className="mt-1.5 text-sm text-foreground/70">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BlinkAppPage;
