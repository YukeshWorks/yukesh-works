interface NavbarProps {
  activeTab: "home" | "character" | "puzzle" | "info";
  onTabChange: (tab: "home" | "character" | "puzzle" | "info") => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="font-display text-lg md:text-xl font-bold gradient-text">
            42
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <button
              onClick={() => onTabChange("home")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "home" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Home
            </button>
            <button
              onClick={() => onTabChange("character")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "character" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Character
            </button>
            <button
              onClick={() => onTabChange("puzzle")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "puzzle" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Puzzle
            </button>
            <button
              onClick={() => onTabChange("info")}
              className={`nav-link px-2 md:px-4 py-1 md:py-2 ${activeTab === "info" ? "active text-primary" : "text-muted-foreground"}`}
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
