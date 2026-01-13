import profileImage from "@/assets/profile.jpg";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Avatar Section */}
          <div className="fade-in-left opacity-0 delay-200">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden avatar-glow pulse-glow-animation border-4 border-primary/30">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-110 float-animation" />
            </div>
          </div>
          
          {/* Content Section */}
          <div className="text-center lg:text-left max-w-xl">
            <div className="fade-in-up opacity-0 delay-100">
              <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">
                I am <span className="text-primary">a Programmer</span>
              </p>
            </div>
            
            <div className="fade-in-up opacity-0 delay-200">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 glow-text">
                Welcome to My <span className="gradient-text">Portfolio</span> ✌️
              </h1>
            </div>
            
            <div className="fade-in-up opacity-0 delay-300">
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Hi, I'm Elow — a creative developer and designer who blends art with code. 
                I enjoy transforming ideas into digital experiences that are both visually 
                appealing and technically sound.
              </p>
            </div>
            
            <div className="fade-in-up opacity-0 delay-400 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button className="btn-glow bg-primary text-primary-foreground px-8 py-6 text-base font-semibold rounded-full">
                View Projects
              </Button>
              <Button 
                variant="outline" 
                className="btn-glow border-primary/50 text-primary hover:bg-primary/10 px-8 py-6 text-base font-semibold rounded-full"
              >
                Contact Me
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;