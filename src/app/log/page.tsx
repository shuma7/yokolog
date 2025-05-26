
"use client";

import { useState, useMemo } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { UserLogTable } from "@/components/data-tables/user-log-table";
import { AggregatedStatsDisplay } from "@/components/stats/aggregated-stats-display";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchData, GameClassNameMap } from "@/types";
import { MatchDataForm, type MatchFormValues } from "@/components/forms/match-data-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUsername } from "@/hooks/use-username";
import { useSeasonManager } from "@/hooks/useSeasonManager";
import { SeasonSelector } from "@/components/stats/season-selector";
import { Card, CardContent, CardHeader, CardTitle as UiCardTitle, CardDescription as UiCardDescription } from "@/components/ui/card"; // Renamed to avoid conflict
import { Skeleton } from "@/components/ui/skeleton";


export default function PersonalLogPage() {
  const { matches, isLoadingMatches, deleteMatch, updateMatch } = useMatchLogger();
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();
  const { username } = useUsername();
  const { 
    selectedSeasonId, 
    setSelectedSeasonId, 
    getAllSeasons, 
    isLoadingSeasons,
    getSelectedSeason,
    formatDateForSeasonName 
  } = useSeasonManager();

  const [editingMatch, setEditingMatch] = useState<MatchData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const gameClassMapping: GameClassNameMap = GAME_CLASS_EN_TO_JP;
  const currentSelectedSeason = getSelectedSeason();

  const currentUserMatches = useMemo(() => {
    if (!username) return [];
    return [...matches].sort((a, b) => b.timestamp - a.timestamp);
  }, [matches, username]);

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

  const handleEditRequest = (match: MatchData) => {
    setEditingMatch(match);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMatchSubmit = (data: MatchFormValues) => {
    if (editingMatch && username) {
      try {
        const updatedMatchData: MatchData = {
          ...editingMatch,
          userId: username,
          userArchetypeId: data.userArchetypeId,
          opponentArchetypeId: data.opponentArchetypeId,
          turn: data.turn,
          result: data.result,
          notes: data.notes,
          // seasonId should be preserved from editingMatch or re-assigned if necessary
          seasonId: editingMatch.seasonId || getSelectedSeason()?.id 
        };
        updateMatch(updatedMatchData);
        toast({
          title: "対戦更新完了",
          description: "対戦記録を更新しました。",
        });
        setIsEditDialogOpen(false);
        setEditingMatch(null);
      } catch (error) {
        console.error("対戦の更新に失敗しました:", error);
        toast({
          title: "エラー",
          description: "対戦を更新できませんでした。もう一度お試しください。",
          variant: "destructive",
        });
      }
    }
  };
  
  if (isLoadingMatches || isLoadingSeasons) {
    return (
        <div className="flex flex-1 flex-col">
        <MainHeader title="個人ログ" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto space-y-4">
            <Skeleton className="h-12 w-1/2" /> {/* Season Selector Skeleton */}
            <Skeleton className="h-10 w-full" /> {/* Tabs Skeleton */}
            <Skeleton className="h-64 w-full" /> {/* Table/Stats Skeleton */}
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="flex flex-1 flex-col">
      <MainHeader
        title="個人ログ"
        actions={
          <Button asChild>
            <Link href="/">
              <PlusCircle className="mr-2 h-4 w-4" /> 新規対戦を追加
            </Link>
          </Button>
        }
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <UiCardTitle>シーズン選択</UiCardTitle>
              <UiCardDescription>表示するシーズンを選択してください。現在のシーズン: {currentSelectedSeason ? currentSelectedSeason.name : '読み込み中...'}</UiCardDescription>
            </CardHeader>
            <CardContent>
               <SeasonSelector
                seasons={getAllSeasons()}
                selectedSeasonId={selectedSeasonId}
                onSelectSeason={setSelectedSeasonId}
                formatDate={formatDateForSeasonName}
              />
            </CardContent>
          </Card>

          {!username ? (
            <p className="text-center text-muted-foreground">ユーザー名が設定されていません。先にユーザー名を設定してください。</p>
          ) : (
            <Tabs defaultValue="log-list">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="log-list">ログ一覧</TabsTrigger>
                <TabsTrigger value="summary-data">集計データ</TabsTrigger>
              </TabsList>
              <TabsContent value="log-list" className="mt-6">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto"> {/* Adjusted max-h */}
                  <UserLogTable
                    matches={currentUserMatches}
                    archetypes={archetypes}
                    onDeleteMatch={handleDeleteMatch}
                    onEditRequest={handleEditRequest}
                    gameClassMapping={gameClassMapping}
                    isReadOnly={false}
                    isMinimal={false}
                  />
                </div>
              </TabsContent>
              <TabsContent value="summary-data" className="mt-6">
                <AggregatedStatsDisplay matches={currentUserMatches} archetypes={archetypes} gameClassMapping={gameClassMapping} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {editingMatch && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setEditingMatch(null);
          }
          setIsEditDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>対戦編集</DialogTitle>
              <DialogDescription>
                対戦の詳細を編集します。変更後「更新」ボタンを押してください。
              </DialogDescription>
            </DialogHeader>
            <MatchDataForm
              archetypes={archetypes}
              onSubmit={handleUpdateMatchSubmit}
              initialData={editingMatch}
              gameClassMapping={gameClassMapping}
              submitButtonText="対戦情報を更新"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
