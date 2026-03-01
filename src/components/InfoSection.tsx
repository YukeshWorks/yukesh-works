import { Instagram, Facebook } from "lucide-react";
import profileHero from "@/assets/profile-hero.png";

const InfoSection = () => {
  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden page-transition bg-background">
      {/* Full-page portfolio layout */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 relative">
          
          {/* Left side - About text (desktop) / Bottom (mobile) */}
          <div className="order-2 md:order-1 max-w-sm z-10 text-center md:text-left">
            <div className="fade-in-up opacity-0 delay-100 mb-6">
              <p className="text-primary text-xs uppercase tracking-[0.3em] mb-2">About</p>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display">
                Me
              </h1>
            </div>
            
            <div className="fade-in-up opacity-0 delay-300">
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                I Mess Around With Whatever Catches My Attention (For As Long As I Remember It). 
                Kinda Forgetful, A Little Off-Minded, Not The Most Responsible Guy—But Hey,
              </p>
              <p className="text-primary font-medium text-lg md:text-xl mt-4">
                I'm Easy To Vibe With!
              </p>
            </div>
            
            {/* Social icons */}
            <div className="fade-in-up opacity-0 delay-500 mt-8">
              <div className="flex items-center gap-6 justify-center md:justify-start">
                <a 
                  href="https://instagram.com/yuk3shh" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  <div className="p-3 rounded-full glass hover:scale-110 transition-transform duration-200">
                    <Instagram size={20} />
                  </div>
                  <span className="text-xs hidden md:inline">@yuk3shh</span>
                </a>
                <a 
                  href="https://facebook.com/yukeshkumar" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  <div className="p-3 rounded-full glass hover:scale-110 transition-transform duration-200">
                    <Facebook size={20} />
                  </div>
                  <span className="text-xs hidden md:inline">yukeshkumar</span>
                </a>
              </div>
            </div>
          </div>

          {/* Center/Right - Hero photo with floating button */}
          <div className="order-1 md:order-2 relative fade-in-up opacity-0 delay-200">
            {/* Photo */}
            <div className="relative w-64 h-80 md:w-80 md:h-[28rem]">
              <img
                src={profileHero}
                alt="Yukesh"
                className="w-full h-full object-cover object-top rounded-2xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.4)]"
              />
              {/* Subtle glow behind */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
            </div>

            {/* Floating "About Me" button with triangle pointer */}
            <div className="absolute top-1/3 -left-4 md:-left-8 flex items-center gap-0 fade-in-up opacity-0 delay-500">
              <div className="px-4 py-2 rounded-full glass border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                <span className="text-xs font-bold uppercase tracking-widest text-primary whitespace-nowrap">
                  About Me
                </span>
              </div>
              {/* Triangle pointing right at the photo */}
              <div 
                className="w-0 h-0 -ml-[1px]"
                style={{
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '10px solid hsl(var(--primary) / 0.4)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
