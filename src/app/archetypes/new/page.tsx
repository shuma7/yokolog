"use client";

import { ArchetypeForm } from "@/components/forms/archetype-form";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useToast } from "@/hooks/use-toast";
import type { GameClass } from "@/types";

export default function AddArchetypePage() {
  const { addArchetype } = useArchetypeManager();
  const { toast } = useToast();

  const handleSubmit = (data: { name: string; abbreviation: string; gameClass: GameClass }) => {
    try {
      const newArchetype = addArchetype(data.name, data.abbreviation, data.gameClass);
      toast({
        title: "Archetype Added",
        description: `Successfully added "${newArchetype.name}".`,
      });
    } catch (error) {
      console.error("Failed to add archetype:", error);
      toast({
        title: "Error",
        description: "Could not add archetype. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="Propose New Archetype" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <ArchetypeForm onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}
