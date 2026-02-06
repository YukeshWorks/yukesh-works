import { Instagram, Facebook } from "lucide-react";
import profileImg from "@/assets/profile.jpg";

const InfoSection = () => {
  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden page-transition">
      {/* Profile photo background */}
      <div className="absolute inset-0">
        <img
          src={profileImg}
          alt="Profile"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            objectPosition: 'center 20%',
          }}
        />
        {/* Gradient overlays for text readability - lighter on mobile for face visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 md:via-background/80 to-transparent md:to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/40" />
      </div>
      
      {/* Floating content on left side */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-md">
            {/* About Me header */}
            <div className="fade-in-up opacity-0 delay-100 mb-8">
              <p className="text-primary text-xs uppercase tracking-[0.3em] mb-2">About</p>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display">
                Me
              </h1>
            </div>
            
            {/* About text */}
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
            <div className="fade-in-up opacity-0 delay-500 mt-10">
              <div className="flex items-center gap-6">
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
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
