import { useState } from "react";

interface NavbarProps {
  activeTab: "character" | "info";
  onTabChange: (tab: "character" | "info") => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="font-display text-xl font-bold gradient-text">
            elow
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("character")}
              className={`nav-link ${activeTab === "character" ? "active text-primary" : "text-muted-foreground"}`}
            >
              Character
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