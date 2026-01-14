interface NavbarProps {
  activeTab: "home" | "character" | "puzzle" | "info";
  onTabChange: (tab: "home" | "character" | "puzzle" | "info") => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="font-display text-xl font-bold gradient-text">
            42
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => onTabChange("home")}
              className={`nav-link ${activeTab === "home" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Home
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => onTabChange("character")}
              className={`nav-link ${activeTab === "character" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Character
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => onTabChange("puzzle")}
              className={`nav-link ${activeTab === "puzzle" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Puzzle
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => onTabChange("info")}
              className={`nav-link ${activeTab === "info" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Info
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
