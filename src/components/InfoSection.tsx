import { Instagram, Twitter, Facebook } from "lucide-react";

const InfoSection = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 page-transition">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-tl from-background via-background to-primary/5" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-1/3 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl float-animation delay-200" />
      
      <div className="container mx-auto px-6 relative z-10 flex-1 flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <div className="fade-in-up opacity-0 delay-100">
              <p className="text-primary text-sm uppercase tracking-widest mb-4">About Me</p>
            </div>
          </div>
          
          <div className="fade-in-up opacity-0 delay-300 glass rounded-2xl p-6 md:p-10 glow-border">
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg text-center">
              I Mess Around With Whatever Catches My Attention (For As Long As I Remember It). 
              Kinda Forgetful, A Little Off-Minded, Not The Most Responsible Guy—But Hey,
              <br /><br />
              <span className="text-primary font-medium text-lg md:text-xl">I'm Easy To Vibe With!</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Social icons at bottom */}
      <div className="relative z-10 pb-8 fade-in-up opacity-0 delay-500">
        <div className="flex items-center justify-center gap-6">
          <a 
            href="#" 
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_hsl(var(--primary))]"
          >
            <Instagram size={24} />
          </a>
          <a 
            href="#" 
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_hsl(var(--primary))]"
          >
            <Twitter size={24} />
          </a>
          <a 
            href="#" 
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_hsl(var(--primary))]"
          >
            <Facebook size={24} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
