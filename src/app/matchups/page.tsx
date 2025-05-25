
"use client";

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { MatchupTableDisplay } from "@/components/data-tables/matchup-table-display";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";
import type { MatchData } from "@/types";

export default function MatchupsPage() {
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const { archetypes } = useArchetypeManager();

  useEffect(() => {
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
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="デッキタイプ相性" />
      <main className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4"> {/* Reduced padding */}
        <div className="container mx-auto">
          <MatchupTableDisplay matches={allMatches} allArchetypes={archetypes} gameClassMapping={GAME_CLASS_EN_TO_JP}/>
        </div>
      </main>
    </div>
  );
}
