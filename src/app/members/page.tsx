
"use client";

import { useState, useMemo, useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
// import { useMatchLogger } from "@/hooks/use-match-logger"; // Not needed for reading other users' logs directly
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
import { useUsername } from "@/hooks/use-username"; // For current user context

export default function MembersPage() {
  const { archetypes } = useArchetypeManager();
  const { toast } = useToast();
  const { username: currentUsername } = useUsername(); // Get current logged-in username

  const [discoveredUsers, setDiscoveredUsers] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [selectedUserMatches, setSelectedUserMatches] = useState<MatchData[]>([]);

  const gameClassMapping: GameClassNameMap = GAME_CLASS_EN_TO_JP;

  useEffect(() => {
    // Discover users by scanning localStorage for match log keys
    const users: string[] = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yokolog_match_logs_')) {
          users.push(key.replace('yokolog_match_logs_', ''));
        }
      }
    }
    setDiscoveredUsers(users.sort());
    // Default to current user if they exist in discovered users, or first user
    if (currentUsername && users.includes(currentUsername)) {
      setSelectedUsername(currentUsername);
    } else if (users.length > 0) {
      setSelectedUsername(users[0]);
    }
  }, [currentUsername]);

  useEffect(() => {
    // Load matches for the selected user
    if (selectedUsername && typeof window !== 'undefined') {
      const item = localStorage.getItem(`yokolog_match_logs_${selectedUsername}`);
      const matchesRaw = item ? JSON.parse(item) : [];
      // Sort matches for display: newest first
      const sortedMatches = [...matchesRaw].sort((a,b) => b.timestamp - a.timestamp);
      setSelectedUserMatches(sortedMatches);
    } else {
      setSelectedUserMatches([]);
    }
  }, [selectedUsername]);


  // For UserLogTable, we pass selectedUserMatches which is already sorted.
  // Editing/Deleting from other users' logs is disabled in UserLogTable for simplicity.
  // If such functionality is needed, it would require careful handling of 'saveMatches' for other users.
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="victory-rankings">勝利数ランキング</TabsTrigger>
              <TabsTrigger value="member-logs">メンバーログ</TabsTrigger>
            </TabsList>
            <TabsContent value="victory-rankings" className="mt-6">
               <Card>
                <CardHeader>
                    <CardTitle>勝利数ランキング</CardTitle>
                    <CardDescription>
                        {selectedUsername ? `${selectedUsername}さんの記録に基づいたランキングです。` : "メンバーを選択してください。"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MemberVictoryRankings 
                        matches={selectedUserMatches} 
                        allArchetypes={archetypes} 
                        gameClassMapping={gameClassMapping} 
                        usernameForDisplay={selectedUsername || "選択ユーザー"}
                    />
                </CardContent>
               </Card>
            </TabsContent>
            <TabsContent value="member-logs" className="mt-6 space-y-6">
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
              
              <UserLogTable
                matches={selectedUserMatches} // Displaying selected user's matches
                archetypes={archetypes}
                onDeleteMatch={handleDeleteMatch} // Operations on other users' logs are disabled
                onEditRequest={handleEditRequest} // Operations on other users' logs are disabled
                gameClassMapping={gameClassMapping}
                isReadOnly={selectedUsername !== currentUsername} // Pass read-only flag
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* Edit dialog is removed from here as editing other users' logs is complex without a backend
          and direct localStorage manipulation for other users is risky.
          If editing current user's logs from here is desired, `useMatchLogger` needs to be used carefully.
      */}
    </div>
  );
}
