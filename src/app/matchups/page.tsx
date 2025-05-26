
"use client";

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { MatchupTableDisplay } from "@/components/data-tables/matchup-table-display";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import type { MatchData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonManager } from "@/hooks/useSeasonManager";
import { SeasonSelector } from "@/components/stats/season-selector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MatchupsPage() {
  const [allMatchesForSelectedSeason, setAllMatchesForSelectedSeason] = useState<MatchData[]>([]);
  const { archetypes } = useArchetypeManager();
  const { 
    selectedSeasonId, 
    setSelectedSeasonId, 
    getAllSeasons, 
    isLoadingSeasons,
    getSelectedSeason,
    formatDateForSeasonName
  } = useSeasonManager();
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const currentSelectedSeason = getSelectedSeason();

  useEffect(() => {
    if (isLoadingSeasons) return;
    setIsLoadingPageData(true);
    const collectedMatches: MatchData[] = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yokolog_match_logs_')) {
          try {
            const item = localStorage.getItem(key);
            const userMatches: MatchData[] = item ? JSON.parse(item) : [];
            // Migrate old matches if seasonId is missing
            const seasons = getAllSeasons();
            const oldestSeason = seasons.length > 0 ? seasons[seasons.length - 1] : null;
            let userMatchesChanged = false;
            const migratedUserMatches = userMatches.map(m => {
                const usernameFromKey = key.replace('yokolog_match_logs_', '');
                let matchWithUserId = {...m, userId: m.userId || usernameFromKey };
                if (!matchWithUserId.seasonId && oldestSeason) {
                  userMatchesChanged = true;
                  return { ...matchWithUserId, seasonId: oldestSeason.id };
                }
                return matchWithUserId;
              });
            if(userMatchesChanged) {
                localStorage.setItem(key, JSON.stringify(migratedUserMatches));
            }
            collectedMatches.push(...migratedUserMatches);
          } catch (e) {
            console.error(`Failed to parse matches for key ${key}:`, e);
          }
        }
      }
    }
    // Filter by selected season
    if (selectedSeasonId) {
      setAllMatchesForSelectedSeason(collectedMatches.filter(m => m.seasonId === selectedSeasonId));
    } else {
      setAllMatchesForSelectedSeason([]); // Or active season if preferred fallback
    }
    setIsLoadingPageData(false);
  }, [selectedSeasonId, isLoadingSeasons, getAllSeasons]);

  if (isLoadingPageData || isLoadingSeasons) {
    return (
      <div className="flex flex-1 flex-col">
        <MainHeader title="デッキタイプ相性" />
        <main className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4">
          <div className="container mx-auto space-y-4 py-8">
             <Skeleton className="h-12 w-1/2" /> {/* Season Selector Skeleton */}
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="rounded-md border">
              <Skeleton className="h-12 w-full" /> {/* Header row */}
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full border-t" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="デッキタイプ相性" />
      <main className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4">
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
          
          <MatchupTableDisplay matches={allMatchesForSelectedSeason} allArchetypes={archetypes} gameClassMapping={GAME_CLASS_EN_TO_JP}/>
        </div>
      </main>
    </div>
  );
}
