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
          
          <div className="fade-in-up opacity-0 delay-300 glass rounded-2xl p-8 md:p-12 glow-border">
            <p className="text-muted-foreground leading-relaxed text-lg text-center">
              I Mess Around With Whatever Catches My Attention (For As Long As I Remember It). 
              Kinda Forgetful, A Little Off-Minded, Not The Most Responsible Guy—But Hey,
              <br /><br />
              <span className="text-primary font-medium">I'm Easy To Vibe With!</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
