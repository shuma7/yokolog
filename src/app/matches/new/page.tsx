"use client";

import { MatchDataForm, type MatchFormValues } from "@/components/forms/match-data-form";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useToast } from "@/hooks/use-toast";

export default function AddMatchPage() {
  const { archetypes } = useArchetypeManager();
  const { addMatch } = useMatchLogger();
  const { toast } = useToast();

  const handleSubmit = (data: MatchFormValues) => {
    try {
      const newMatch = addMatch(data);
      if (newMatch) {
        toast({
          title: "Match Logged",
          description: "Your match has been successfully recorded.",
        });
      } else {
         toast({
          title: "Error",
          description: "Could not log match. Ensure you are logged in.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to log match:", error);
      toast({
        title: "Error",
        description: "Could not log match. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="Log New Match" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {archetypes.length > 0 ? (
            <MatchDataForm archetypes={archetypes} onSubmit={handleSubmit} />
          ) : (
            <div className="text-center text-muted-foreground">
              Loading archetypes or no archetypes defined. Please add archetypes first.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
