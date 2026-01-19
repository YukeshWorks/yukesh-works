import { useState } from "react";
import { X, ExternalLink, Github, Folder } from "lucide-react";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const projects = [
  {
    title: "Portfolio Website",
    description: "Personal portfolio with interactive animations",
    tags: ["React", "TypeScript", "Tailwind"],
    link: "#",
    github: "#",
  },
  {
    title: "Game Dashboard",
    description: "Analytics dashboard for gaming statistics",
    tags: ["Next.js", "D3.js", "API"],
    link: "#",
    github: "#",
  },
  {
    title: "Mobile App UI",
    description: "Cross-platform mobile app design system",
    tags: ["React Native", "Figma"],
    link: "#",
    github: "#",
  },
];

const PortfolioModal = ({ isOpen, onClose }: PortfolioModalProps) => {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[80vh] overflow-auto glass rounded-2xl p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold gradient-text">My Work</h2>
          </div>
          <p className="text-xs text-muted-foreground">Selected projects and experiments</p>
        </div>
        
        {/* Projects grid */}
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group p-4 rounded-xl glass hover:bg-primary/5 transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredProject(index)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{
                transform: hoveredProject === index ? 'translateX(8px)' : 'translateX(0)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {project.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-2 py-0.5 text-[9px] rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <a 
                    href={project.github}
                    className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                  <a 
                    href={project.link}
                    className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">More projects coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
