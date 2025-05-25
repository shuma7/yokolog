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
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";

export default function UserLogPage() {
  const { matches, deleteMatch } = useMatchLogger();
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();

  const sortedMatches = [...matches].sort((a, b) => b.timestamp - a.timestamp);

  const handleDeleteMatch = (matchId: string) => {
    try {
      deleteMatch(matchId);
      toast({
        title: "対戦削除完了",
        description: "対戦記録を削除しました。",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "対戦記録を削除できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-1 flex-col">
      <MainHeader 
        title="マイ対戦記録"
        actions={
          <Button asChild>
            <Link href="/matches/new">
              <PlusCircle className="mr-2 h-4 w-4" /> 新規対戦を追加
            </Link>
          </Button>
        }
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <UserStatsDisplay matches={sortedMatches} archetypes={archetypes} gameClassMapping={GAME_CLASS_EN_TO_JP} />
          <h2 className="text-2xl font-semibold mb-4 mt-8">対戦履歴</h2>
          <UserLogTable 
            matches={sortedMatches} 
            archetypes={archetypes} 
            onDeleteMatch={handleDeleteMatch}
            gameClassMapping={GAME_CLASS_EN_TO_JP}
          />
        </div>
      </main>
    </div>
  );
}
