
"use client";

import { MatchDataForm, type MatchFormValues } from "@/components/forms/match-data-form";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useToast } from "@/hooks/use-toast";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import { useUsername } from "@/hooks/use-username"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardDescription } from "@/components/ui/card";
import { useSeasonManager } from "@/hooks/useSeasonManager"; // Import useSeasonManager

export default function HomePage() { 
  const { archetypes } = useArchetypeManager();
  const { username } = useUsername(); 
  const { selectedSeasonId, getActiveSeason } = useSeasonManager(); // Get selectedSeasonId and getActiveSeason
  
  // Pass the selectedSeasonId or active season's ID to useMatchLogger
  const { addMatch, matches: userMatches } = useMatchLogger(selectedSeasonId ?? getActiveSeason()?.id ?? null);
  const { toast } = useToast();

  const handleSubmit = (data: MatchFormValues, resetFormCallback: () => void) => {
    if (!username) { 
      toast({
        title: "エラー",
        description: "ユーザー名が設定されていません。対戦を記録できません。",
        variant: "destructive",
      });
      return;
    }
    try {
      const newMatch = addMatch(data);
      if (newMatch) { 
        toast({
          title: "対戦記録完了",
          description: "対戦が正常に記録されました。",
        });
        resetFormCallback(); 
      } else {
         toast({
          title: "エラー",
          description: "対戦を記録できませんでした。入力内容を確認してください。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("対戦の記録に失敗しました:", error);
      toast({
        title: "エラー",
        description: "対戦を記録できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  if (archetypes.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <MainHeader title="新規対戦を記録" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto">
            <div className="text-center text-muted-foreground py-8 space-y-4">
              <p>デッキタイプを読み込み中、またはデッキタイプが定義されていません。先にデッキタイプを追加してください。</p>
              <div className="space-y-6 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-1/2 mx-auto" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="新規対戦を記録" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {username && (
            <Card className="mb-6 bg-muted/30">
              <CardDescription className="p-3 text-sm text-center text-foreground">
                {username}の総試合数：{userMatches.length}戦
              </CardDescription>
            </Card>
          )}
          <MatchDataForm archetypes={archetypes} onSubmit={handleSubmit} gameClassMapping={GAME_CLASS_EN_TO_JP} />
        </div>
      </main>
    </div>
  );
}
