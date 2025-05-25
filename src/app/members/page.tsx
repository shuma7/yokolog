
"use client";

import { useState, useMemo } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { UserLogTable } from "@/components/data-tables/user-log-table";
import { MemberVictoryRankings } from "@/components/stats/member-victory-rankings";
import { useToast } from "@/hooks/use-toast";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchData, GameClassNameMap, Archetype } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchDataForm, type MatchFormValues } from "@/components/forms/match-data-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function MembersPage() {
  const { matches, deleteMatch, updateMatch } = useMatchLogger();
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();

  const [editingMatch, setEditingMatch] = useState<MatchData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("all"); // Placeholder

  const gameClassMapping: GameClassNameMap = GAME_CLASS_EN_TO_JP;

  // For UserLogTable, matches should be sorted reverse-chronologically
  const sortedMatchesForDisplay = useMemo(() =>
    [...matches].sort((a, b) => b.timestamp - a.timestamp),
    [matches]
  );

  // In a real multi-user scenario, you would filter matches by selectedMember here.
  // For now, it always shows all matches.
  const memberLogsToDisplay = sortedMatchesForDisplay;

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
        description: "対戦記録を削除できませんでした。",
        variant: "destructive",
      });
    }
  };

  const handleEditRequest = (match: MatchData) => {
    setEditingMatch(match);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMatchSubmit = (data: MatchFormValues) => {
    if (editingMatch) {
      try {
        const updatedMatchData: MatchData = {
          ...editingMatch,
          userArchetypeId: data.userArchetypeId,
          opponentArchetypeId: data.opponentArchetypeId,
          turn: data.turn,
          result: data.result,
          notes: data.notes,
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
          description: "対戦を更新できませんでした。",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="メンバーデータ" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <Tabs defaultValue="victory-rankings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="victory-rankings">勝利数ランキング</TabsTrigger>
              <TabsTrigger value="member-logs">メンバーログ</TabsTrigger>
            </TabsList>
            <TabsContent value="victory-rankings" className="mt-6">
              <MemberVictoryRankings matches={matches} allArchetypes={archetypes} gameClassMapping={gameClassMapping} />
            </TabsContent>
            <TabsContent value="member-logs" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>メンバー選択</CardTitle>
                   <CardDescription>
                    現在、個別のユーザーアカウント機能は実装されていません。
                    そのため、以下のログは全ユーザーの統合ログが表示されます。
                  </CardDescription>
                </CardHeader>
                 <div className="p-6 pt-0">
                    <Select value={selectedMember} onValueChange={setSelectedMember} disabled>
                        <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="メンバーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">全てのログ (現バージョン)</SelectItem>
                        {/* In the future, list actual members here */}
                        </SelectContent>
                    </Select>
                 </div>
              </Card>
              
              <UserLogTable
                matches={memberLogsToDisplay}
                archetypes={archetypes}
                onDeleteMatch={handleDeleteMatch}
                onEditRequest={handleEditRequest}
                gameClassMapping={gameClassMapping}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {editingMatch && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setEditingMatch(null);
          }
          setIsEditDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-[600px]">
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
