"use client";

import { MatchDataForm, type MatchFormValues } from "@/components/forms/match-data-form";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useToast } from "@/hooks/use-toast";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";

export default function AddMatchPage() {
  const { archetypes } = useArchetypeManager();
  const { addMatch } = useMatchLogger();
  const { toast } = useToast();

  const handleSubmit = (data: MatchFormValues) => {
    try {
      const newMatch = addMatch(data);
      // Since username check is removed from addMatch, it should always return a match object now
      // unless a new failure condition is added to addMatch later.
      if (newMatch) { 
        toast({
          title: "対戦記録完了",
          description: "対戦が正常に記録されました。",
        });
      } else {
        // This else block might become unreachable if addMatch always succeeds.
        // Kept for robustness in case addMatch is modified to have other failure modes.
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

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="新規対戦を記録" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {archetypes.length > 0 ? (
            <MatchDataForm archetypes={archetypes} onSubmit={handleSubmit} gameClassMapping={GAME_CLASS_EN_TO_JP} />
          ) : (
            <div className="text-center text-muted-foreground">
              デッキタイプを読み込み中、またはデッキタイプが定義されていません。先にデッキタイプを追加してください。
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
