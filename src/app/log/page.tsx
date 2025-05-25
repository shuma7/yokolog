"use client";

import { MainHeader } from "@/components/layout/main-header";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { UserLogTable } from "@/components/data-tables/user-log-table";
import { UserStatsDisplay } from "@/components/stats/user-stats-display";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function UserLogPage() {
  const { matches, deleteMatch } = useMatchLogger();
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();

  const sortedMatches = [...matches].sort((a, b) => b.timestamp - a.timestamp);

  const handleDeleteMatch = (matchId: string) => {
    try {
      deleteMatch(matchId);
      toast({
        title: "Match Deleted",
        description: "The match record has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete match. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // const handleEditMatch = (match: MatchData) => {
  //   // TODO: Implement modal or navigation for editing a match
  //   toast({ title: "Edit action (not implemented)", description: `Editing match ID: ${match.id}`});
  // };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader 
        title="My Match Log"
        actions={
          <Button asChild>
            <Link href="/matches/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Match
            </Link>
          </Button>
        }
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <UserStatsDisplay matches={sortedMatches} archetypes={archetypes} />
          <h2 className="text-2xl font-semibold mb-4 mt-8">Match History</h2>
          <UserLogTable 
            matches={sortedMatches} 
            archetypes={archetypes} 
            onDeleteMatch={handleDeleteMatch}
            // onEditMatch={handleEditMatch} 
          />
        </div>
      </main>
    </div>
  );
}
