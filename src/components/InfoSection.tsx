import { Code, Palette, Zap, Heart } from "lucide-react";

const skills = [
  { icon: Code, title: "Development", desc: "React, TypeScript, Node.js" },
  { icon: Palette, title: "Design", desc: "UI/UX, Figma, Animation" },
  { icon: Zap, title: "Performance", desc: "Optimization & Speed" },
  { icon: Heart, title: "Passion", desc: "Clean & Beautiful Code" },
];

const InfoSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-tl from-background via-background to-primary/5" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="fade-in-up opacity-0 delay-100">
              <p className="text-primary text-sm uppercase tracking-widest mb-2">About Me</p>
            </div>
            <div className="fade-in-up opacity-0 delay-200">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold glow-text">
                Who I <span className="gradient-text">Am</span>
              </h2>
            </div>
          </div>
          
          <div className="fade-in-up opacity-0 delay-300 glass rounded-2xl p-8 md:p-12 glow-border mb-12">
            <p className="text-muted-foreground leading-relaxed text-lg text-center">
              I'm a passionate developer with a keen eye for design. I specialize in creating 
              modern web applications that not only function flawlessly but also deliver 
              exceptional user experiences. My journey in tech started with curiosity and 
              evolved into a deep love for crafting digital solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {skills.map((skill, index) => (
              <div 
                key={skill.title}
                className={`fade-in-up opacity-0 delay-${(index + 3) * 100} glass rounded-xl p-6 text-center hover:glow-border transition-all duration-300 group cursor-pointer`}
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <skill.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                  {skill.title}
                </h3>
                <p className="text-muted-foreground text-xs">{skill.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="fade-in-up opacity-0 delay-500 mt-12 text-center">
            <div className="inline-flex items-center gap-4 glass rounded-full px-6 py-3">
              <span className="text-muted-foreground text-sm">Available for freelance work</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;