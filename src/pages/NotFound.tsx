import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>
      <div className="relative max-w-md text-center fade-in-up">
        <p className="font-heading text-[10px] uppercase tracking-[0.3em] text-primary">Error 404</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight gradient-text sm:text-6xl">Lost in thoughts.</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Nothing lives at <code className="break-all rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">{location.pathname}</code>. The link may be old or mistyped.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 font-heading text-xs uppercase tracking-[0.2em] text-primary-foreground transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <Link to="/services" className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-2 border-primary/60 px-5 py-2.5 font-heading text-xs uppercase tracking-[0.2em] text-primary transition-colors duration-200 hover:bg-primary/10">
            Digital Services <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
