
"use client";

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { MatchupTableDisplay } from "@/components/data-tables/matchup-table-display";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import type { MatchData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchupsPage() {
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const { archetypes } = useArchetypeManager();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const collectedMatches: MatchData[] = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yokolog_match_logs_')) {
          try {
            const item = localStorage.getItem(key);
            const userMatches = item ? JSON.parse(item) : [];
            if (Array.isArray(userMatches)) {
              // Ensure each match has a userId, inferring from key if necessary (though should be in data)
              const matchesWithUserId = userMatches.map(m => {
                if (!m.userId) {
                  const usernameFromKey = key.replace('yokolog_match_logs_', '');
                  return { ...m, userId: usernameFromKey };
                }
                return m;
              });
              collectedMatches.push(...matchesWithUserId);
            }
          } catch (e) {
            console.error(`Failed to parse matches for key ${key}:`, e);
          }
        }
      }
    }
    setAllMatches(collectedMatches);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="デッキタイプ相性" />
      <main className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-8 w-1/4 mb-4" />
              <div className="rounded-md border">
                <Skeleton className="h-12 w-full" /> {/* Header row */}
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full border-t" /> 
                ))}
              </div>
            </div>
          ) : (
            <MatchupTableDisplay matches={allMatches} allArchetypes={archetypes} gameClassMapping={GAME_CLASS_EN_TO_JP}/>
          )}
        </div>
      </main>
    </div>
  );
}
