import { useState } from "react";
import { X, ExternalLink, Github, Folder, FlaskConical, LockKeyhole } from "lucide-react";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const projects = [
  {
    title: "Yukeshworks",
    description: "An interactive personal portfolio with cinematic visuals, responsive themes and mini-games.",
    tags: ["React", "TypeScript", "Vite", "Tailwind"],
    status: "Live website",
    link: "https://yukeshworks.lovable.app",
    github: "https://github.com/YukeshWorks/yukesh-works",
    icon: "web",
  },
  {
    title: "BLINK / Mindful Life Hub",
    description: "A personal productivity and wellness dashboard prototype combining planning, fitness and daily tracking.",
    tags: ["PWA", "Productivity", "Mobile UI"],
    status: "Private prototype",
    icon: "private",
  },
  {
    title: "Smart Seafood Freshness Biosensor",
    description: "A biodegradable pH-responsive patch concept using natural polymers and pH-sensitive pigments to monitor seafood freshness.",
    tags: ["Biotechnology", "Biosensors", "Sustainable materials"],
    status: "Research project",
    icon: "research",
  },
];

const PortfolioModal = ({ isOpen, onClose }: PortfolioModalProps) => {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-auto glass rounded-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close projects" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200">
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold gradient-text">My Work</h2>
          </div>
          <p className="text-xs text-muted-foreground">Selected software and biotechnology projects</p>
        </div>

        <div className="space-y-4">
          {projects.map((project, index) => (
            <article
              key={project.title}
              className="group p-4 rounded-xl glass hover:bg-primary/5 transition-all duration-300"
              onMouseEnter={() => setHoveredProject(index)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{ transform: hoveredProject === index ? "translateX(8px)" : "translateX(0)", transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {project.icon === "research" ? <FlaskConical className="w-4 h-4 text-primary" /> : project.icon === "private" ? <LockKeyhole className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />}
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200">{project.title}</h3>
                    <span className="text-[9px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-1">{project.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-[9px] rounded-full bg-primary/10 text-primary font-medium">{tag}</span>)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {project.github && <a aria-label={`GitHub source for ${project.title}`} href={project.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200"><Github className="w-3.5 h-3.5" /></a>}
                  {project.link && <a aria-label={`Open ${project.title}`} href={project.link} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">Private and research work is labelled clearly; only public links are clickable.</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
