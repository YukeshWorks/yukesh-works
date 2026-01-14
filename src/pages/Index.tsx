import { useState } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import CharacterPage from "@/components/CharacterPage";
import PuzzlePage from "@/components/PuzzlePage";
import InfoSection from "@/components/InfoSection";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "character" | "puzzle" | "info">("home");

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "character":
        return <CharacterPage />;
      case "puzzle":
        return <PuzzlePage />;
      case "info":
        return <InfoSection />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      {renderPage()}
    </div>
  );
};

export default Index;
