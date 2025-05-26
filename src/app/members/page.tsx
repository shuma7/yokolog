
"use client";

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { UserLogTable } from "@/components/data-tables/user-log-table";
import { MemberVictoryRankings } from "@/components/stats/member-victory-rankings";
import { useToast } from "@/hooks/use-toast";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchData, GameClassNameMap } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent as UiDialogContent, // Aliased to avoid conflict
  DialogHeader as UiDialogHeader,
  DialogTitle as UiDialogTitle,
  DialogFooter as UiDialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsername } from "@/hooks/use-username";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonManager } from "@/hooks/useSeasonManager";
import { SeasonSelector } from "@/components/stats/season-selector";

const NEW_SEASON_PASSWORD = "!3zeroms&7";

export default function MembersPage() {
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();
  const { username: currentUsername } = useUsername();
  const {
    selectedSeasonId,
    setSelectedSeasonId,
    getAllSeasons,
    startNewSeason,
    isLoadingSeasons,
    getSelectedSeason,
    formatDateForSeasonName
  } = useSeasonManager();

  const [discoveredUsers, setDiscoveredUsers] = useState<string[]>([]);
  const [selectedLogUsername, setSelectedLogUsername] = useState<string>("");
  const [selectedUserMatchesForLog, setSelectedUserMatchesForLog] = useState<MatchData[]>([]);
  const [allUsersAllMatches, setAllUsersAllMatches] = useState<MatchData[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isMemberLogLoading, setIsMemberLogLoading] = useState(false);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isConfirmNewSeasonDialogOpen, setIsConfirmNewSeasonDialogOpen] = useState(false);


  const gameClassMapping: GameClassNameMap = GAME_CLASS_EN_TO_JP;
  const currentSelectedSeason = getSelectedSeason();

  useEffect(() => {
    if (isLoadingSeasons) return;
    setIsLoadingPageData(true);
    const users: string[] = [];
    const allMatches: MatchData[] = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yokolog_match_logs_')) {
          const user = key.replace('yokolog_match_logs_', '');
          if (user) {
            users.push(user);
            try {
              const item = localStorage.getItem(key);
              const userMatches: MatchData[] = item ? JSON.parse(item) : [];
              // Migrate old matches to oldest season if seasonId is missing
              const seasons = getAllSeasons();
              const oldestSeason = seasons.length > 0 ? seasons[seasons.length - 1] : null;
              let userMatchesChanged = false;
              const migratedUserMatches = userMatches.map(m => {
                let matchWithUserId = {...m, userId: m.userId || user };
                if (!matchWithUserId.seasonId && oldestSeason) {
                  userMatchesChanged = true;
                  return { ...matchWithUserId, seasonId: oldestSeason.id };
                }
                return matchWithUserId;
              });
              if(userMatchesChanged && user) { // Check if user is not null/empty
                localStorage.setItem(key, JSON.stringify(migratedUserMatches));
              }
              allMatches.push(...migratedUserMatches);
            } catch (e) {
              console.error(`Failed to parse matches for user ${user}:`, e);
            }
          }
        }
      }
    }
    const sortedUsers = users.sort((a, b) => a.localeCompare(b));
    setDiscoveredUsers(sortedUsers);
    setAllUsersAllMatches(allMatches);

    if (currentUsername && sortedUsers.includes(currentUsername)) {
      setSelectedLogUsername(currentUsername);
    } else if (sortedUsers.length > 0) {
      setSelectedLogUsername(sortedUsers[0]);
    }
    setIsLoadingPageData(false);
  }, [currentUsername, isLoadingSeasons, getAllSeasons]);

  useEffect(() => {
    if (selectedLogUsername && selectedSeasonId && typeof window !== 'undefined') {
      setIsMemberLogLoading(true);
      const item = localStorage.getItem(`yokolog_match_logs_${selectedLogUsername}`);
      const matchesRaw: MatchData[] = item ? JSON.parse(item) : [];
      // Filter by selected season and ensure userId
      const seasonMatches = matchesRaw
        .map(m => ({...m, userId: m.userId || selectedLogUsername }))
        .filter(m => m.seasonId === selectedSeasonId);
      const sortedMatches = [...seasonMatches].sort((a,b) => b.timestamp - a.timestamp);
      setSelectedUserMatchesForLog(sortedMatches);
      setIsMemberLogLoading(false);
    } else {
      setSelectedUserMatchesForLog([]);
    }
  }, [selectedLogUsername, selectedSeasonId]);

  const handleInitiateNewSeason = () => {
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === NEW_SEASON_PASSWORD) {
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
      setIsConfirmNewSeasonDialogOpen(true);
    } else {
      toast({
        title: "エラー",
        description: "パスワードが違います。",
        variant: "destructive",
      });
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
    }
  };

  const handleConfirmStartNewSeason = () => {
    startNewSeason();
    toast({
      title: "新シーズン開始",
      description: "新しいシーズンが開始されました。記録は新しいシーズンに保存されます。",
    });
    setIsConfirmNewSeasonDialogOpen(false);
  };

  const matchesForCurrentSeasonRankings = allUsersAllMatches.filter(m => m.seasonId === selectedSeasonId);

  if (isLoadingPageData || isLoadingSeasons) {
    return (
      <div className="flex flex-1 flex-col">
        <MainHeader title="メンバーデータ" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto space-y-6">
            <Skeleton className="h-10 w-full" /> {/* TabsList Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" /> {/* CardTitle Skeleton */}
                <Skeleton className="h-4 w-3/4" /> {/* CardDescription Skeleton */}
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="メンバーデータ" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>シーズン選択</CardTitle>
              <CardDescription>表示するシーズンを選択してください。現在のシーズン: {currentSelectedSeason ? currentSelectedSeason.name : '読み込み中...'}</CardDescription>
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

          <Tabs defaultValue="victory-rankings">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="victory-rankings">勝利数ランキング</TabsTrigger>
              <TabsTrigger value="member-logs">メンバーログ</TabsTrigger>
            </TabsList>
            <TabsContent value="victory-rankings" className="mt-0">
               <Card>
                <CardHeader>
                    <CardTitle>ユーザー別 勝利数ランキング</CardTitle>
                    <CardDescription>
                        各クラスおよびデッキタイプごとの、全ユーザーの勝利数ランキングです。
                        現在の表示シーズン: {currentSelectedSeason ? currentSelectedSeason.name : 'N/A'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MemberVictoryRankings
                        matches={matchesForCurrentSeasonRankings}
                        allArchetypes={archetypes}
                        gameClassMapping={gameClassMapping}
                    />
                </CardContent>
               </Card>
            </TabsContent>
            <TabsContent value="member-logs" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>メンバーログ表示</CardTitle>
                   <CardDescription>
                    表示したいメンバーを選択してください。現在の表示シーズン: {currentSelectedSeason ? currentSelectedSeason.name : 'N/A'}
                  </CardDescription>
                </CardHeader>
                 <CardContent>
                    <Select
                        value={selectedLogUsername}
                        onValueChange={setSelectedLogUsername}
                        disabled={discoveredUsers.length === 0}
                    >
                        <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="メンバーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {discoveredUsers.length === 0 && <SelectItem value="no-users" disabled>記録のあるユーザーがいません</SelectItem>}
                          {discoveredUsers.map(user => (
                            <SelectItem key={user} value={user}>{user}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                 </CardContent>
              </Card>

              <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                {isMemberLogLoading ? (
                  <div className="space-y-2 mt-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : selectedLogUsername ? (
                  <UserLogTable
                    matches={selectedUserMatchesForLog}
                    archetypes={archetypes}
                    onDeleteMatch={() => toast({ title: "操作不可", description: "他ユーザーのログは削除できません。", variant: "destructive"})}
                    onEditRequest={() => toast({ title: "操作不可", description: "他ユーザーのログは編集できません。", variant: "destructive"})}
                    gameClassMapping={gameClassMapping}
                    isReadOnly={selectedLogUsername !== currentUsername}
                    isMinimal={true}
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {discoveredUsers.length > 0 ? "メンバーを選択してください。" : "表示できるメンバーログがありません。"}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-10 flex justify-center">
            <Button variant="destructive" size="lg" onClick={handleInitiateNewSeason}>
                新しいシーズンを開始
            </Button>
          </div>

          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <UiDialogContent className="sm:max-w-[425px]">
              <UiDialogHeader>
                <UiDialogTitle>パスワード入力</UiDialogTitle>
              </UiDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password-input" className="text-right col-span-1">
                    パスワード
                  </Label>
                  <Input
                    id="password-input"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="col-span-3"
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  />
                </div>
              </div>
              <UiDialogFooter>
                <Button type="button" onClick={() => setIsPasswordDialogOpen(false)} variant="outline">キャンセル</Button>
                <Button type="submit" onClick={handlePasswordSubmit}>確認</Button>
              </UiDialogFooter>
            </UiDialogContent>
          </Dialog>

          <AlertDialog open={isConfirmNewSeasonDialogOpen} onOpenChange={setIsConfirmNewSeasonDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>新しいシーズンを開始しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  現在のシーズンが終了し、新しいシーズンが開始されます。
                  現在のシーズンの記録は過去のデータとして保存されます。
                  この操作は元に戻せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmNewSeasonDialogOpen(false)}>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmStartNewSeason} className="bg-destructive hover:bg-destructive/80">
                  開始する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </main>
    </div>
  );
}

    