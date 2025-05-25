
"use client";

import { useState, useMemo, useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
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
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUsername } from "@/hooks/use-username";

export default function MembersPage() {
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();
  const { username: currentUsername } = useUsername();

  const [discoveredUsers, setDiscoveredUsers] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [selectedUserMatches, setSelectedUserMatches] = useState<MatchData[]>([]);
  const [allUsersMatches, setAllUsersMatches] = useState<MatchData[]>([]);

  const gameClassMapping: GameClassNameMap = GAME_CLASS_EN_TO_JP;

  useEffect(() => {
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
              const userMatches = item ? JSON.parse(item) : [];
              if (Array.isArray(userMatches)) {
                allMatches.push(...userMatches.map(m => ({...m, userId: m.userId || user })));
              }
            } catch (e) {
              console.error(`Failed to parse matches for user ${user}:`, e);
            }
          }
        }
      }
    }
    const sortedUsers = users.sort((a, b) => a.localeCompare(b));
    setDiscoveredUsers(sortedUsers);
    setAllUsersMatches(allMatches);

    if (currentUsername && sortedUsers.includes(currentUsername)) {
      setSelectedUsername(currentUsername);
    } else if (sortedUsers.length > 0) {
      setSelectedUsername(sortedUsers[0]);
    }
  }, [currentUsername]);

  useEffect(() => {
    if (selectedUsername && typeof window !== 'undefined') {
      const item = localStorage.getItem(`yokolog_match_logs_${selectedUsername}`);
      const matchesRaw = item ? JSON.parse(item) : [];
      const matchesWithUserId = matchesRaw.map((m: MatchData) => ({...m, userId: m.userId || selectedUsername }));
      const sortedMatches = [...matchesWithUserId].sort((a,b) => b.timestamp - a.timestamp);
      setSelectedUserMatches(sortedMatches);
    } else {
      setSelectedUserMatches([]);
    }
  }, [selectedUsername]);

  const handleDeleteMatch = (matchId: string) => {
     toast({
        title: "操作不可",
        description: "他のユーザーのログはここから削除できません。",
        variant: "destructive",
      });
  };

  const handleEditRequest = (match: MatchData) => {
     toast({
        title: "操作不可",
        description: "他のユーザーのログはここから編集できません。",
        variant: "destructive",
      });
  };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="メンバーデータ" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
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
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MemberVictoryRankings 
                        matches={allUsersMatches} 
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
                    表示したいメンバーを選択してください。
                  </CardDescription>
                </CardHeader>
                 <CardContent>
                    <Select 
                        value={selectedUsername} 
                        onValueChange={setSelectedUsername}
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
              
              <div className="max-h-[calc(100vh-330px)] overflow-y-auto"> {/* Adjusted max-h here, considering elements above */}
                {selectedUsername ? (
                  <UserLogTable
                    matches={selectedUserMatches}
                    archetypes={archetypes}
                    onDeleteMatch={handleDeleteMatch}
                    onEditRequest={handleEditRequest}
                    gameClassMapping={gameClassMapping}
                    isReadOnly={selectedUsername !== currentUsername}
                    isMinimal={true} // Apply minimal styling for member logs
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {discoveredUsers.length > 0 ? "メンバーを選択してください。" : "表示できるメンバーログがありません。"}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
