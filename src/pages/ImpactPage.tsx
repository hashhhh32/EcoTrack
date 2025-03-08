import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ImpactAndMission from "@/components/ImpactAndMission";

const ImpactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 bg-gradient-to-r from-primary/90 to-secondary/90 text-white">
        <div className="container mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="mr-2 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Our Impact & Mission</h1>
        </div>
      </header>

      <ImpactAndMission />
    </div>
  );
};

export default ImpactPage; 