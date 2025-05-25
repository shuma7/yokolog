
"use client";

import { MainHeader } from "@/components/layout/main-header";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { MatchupTableDisplay } from "@/components/data-tables/matchup-table-display";
import { GAME_CLASS_EN_TO_JP } from "@/lib/game-data";

export default function MatchupsPage() {
  const { matches } = useMatchLogger();
  const { archetypes } = useArchetypeManager();

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="デッキタイプ相性" />
      <main className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4"> {/* Reduced padding */}
        <div className="container mx-auto">
          <MatchupTableDisplay matches={matches} allArchetypes={archetypes} gameClassMapping={GAME_CLASS_EN_TO_JP}/>
        </div>
      </main>
    </div>
  );
}
