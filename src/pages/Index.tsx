import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InfoSection from "@/components/InfoSection";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"character" | "info">("character");

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "character" ? <HeroSection /> : <InfoSection />}
    </div>
  );
};

export default Index;