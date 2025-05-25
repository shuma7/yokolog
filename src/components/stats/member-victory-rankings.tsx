
"use client";

import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { ALL_GAME_CLASSES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from "@/lib/game-data";
import { useMemo } from "react";

interface UserWinEntry {
  username: string;
  wins: number;
  rank: number;
}

interface RankingDisplayProps {
  title: string;
  icon: React.ElementType;
  userRankings: UserWinEntry[];
}

function RankingSection({ title, icon: Icon, userRankings }: RankingDisplayProps) {
  if (userRankings.length === 0) {
    return null; // Don't render if no one has wins for this item
  }
  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="flex items-center text-lg font-semibold">
          {Icon && <Icon className="mr-2 h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1.5 text-sm">
          {userRankings.map((r) => (
            <li key={r.username} className="flex justify-between">
              <span>
                <span className="inline-block w-6 text-right mr-1 font-medium">{r.rank}.</span>
                {r.username}
              </span>
              <span className="font-semibold">{r.wins}勝</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

interface MemberVictoryRankingsProps {
  matches: MatchData[];
  allArchetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

export function MemberVictoryRankings({ matches, allArchetypes, gameClassMapping }: MemberVictoryRankingsProps) {

  const assignRanks = (userWins: {username: string, wins: number}[]) => {
    const rankedList: UserWinEntry[] = [];
    if (userWins.length === 0) return rankedList;

    let currentRank = 0;
    let lastWins = -1;
    // Iterate through all users with wins to assign correct ranks based on ties
    userWins.forEach((userWin, index) => {
      if (userWin.wins !== lastWins) {
        currentRank = index + 1; 
        lastWins = userWin.wins;
      }
      // Only add to the list if their rank would be within top 5 (or if they tie with someone in top 5)
      // This logic is tricky if we want to show more than 5 if there's a tie at 5th place.
      // For simplicity, we'll rank everyone first, then slice.
      rankedList.push({ ...userWin, rank: currentRank });
    });
    return rankedList;
  };

  const classRankingsData = useMemo(() => {
    return ALL_GAME_CLASSES.map(gc => {
      const winsByClassForUser: Record<string, number> = {};
      matches.forEach(match => {
        if (match.result === 'win' && match.userId) {
          const userArchetype = allArchetypes.find(a => a.id === match.userArchetypeId);
          if (userArchetype && userArchetype.gameClass === gc.value) {
            winsByClassForUser[match.userId] = (winsByClassForUser[match.userId] || 0) + 1;
          }
        }
      });

      const sortedUserWins = Object.entries(winsByClassForUser)
        .map(([username, wins]) => ({ username, wins }))
        .filter(item => item.wins > 0) // Ensure only users with wins are considered
        .sort((a, b) => b.wins - a.wins);
      
      if (sortedUserWins.length === 0) return null;

      const rankedUsers = assignRanks(sortedUserWins);
      const top5Users = rankedUsers.slice(0, 5);


      return {
        title: `${gameClassMapping[gc.value] || gc.value}ランキング`,
        icon: CLASS_ICONS[gc.value] || GENERIC_ARCHETYPE_ICON,
        userRankings: top5Users,
      };
    }).filter(Boolean) as RankingDisplayProps[];
  }, [matches, allArchetypes, gameClassMapping]);

  const archetypeRankingsData = useMemo(() => {
    return allArchetypes
      .filter(arch => arch.id !== 'unknown') // Do not rank the 'unknown' archetype
      .map(arch => {
        const winsByArchetypeForUser: Record<string, number> = {};
        matches.forEach(match => {
          if (match.result === 'win' && match.userId && match.userArchetypeId === arch.id) {
            winsByArchetypeForUser[match.userId] = (winsByArchetypeForUser[match.userId] || 0) + 1;
          }
        });

        const sortedUserWins = Object.entries(winsByArchetypeForUser)
          .map(([username, wins]) => ({ username, wins }))
          .filter(item => item.wins > 0) // Ensure only users with wins are considered
          .sort((a, b) => b.wins - a.wins);

        if (sortedUserWins.length === 0) return null;
        
        const rankedUsers = assignRanks(sortedUserWins);
        const top5Users = rankedUsers.slice(0, 5);
        
        const Icon = CLASS_ICONS[arch.gameClass] || GENERIC_ARCHETYPE_ICON;
        return {
          title: `${formatArchetypeNameWithSuffix(arch)}ランキング`,
          icon: Icon,
          userRankings: top5Users,
        };
      })
      .filter(Boolean) as RankingDisplayProps[];
  }, [matches, allArchetypes]);


  if (matches.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        集計対象の対戦データがありません。
      </p>
    );
  }

  const noWinsRecorded = classRankingsData.length === 0 && archetypeRankingsData.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">クラス別 ユーザー勝利数ランキング</h2>
        {classRankingsData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classRankingsData.map(data => <RankingSection key={data.title} {...data} />)}
          </div>
        ) : (
          !noWinsRecorded && <p className="text-muted-foreground">勝利記録のあるクラスがありません。</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">アーキタイプ別 ユーザー勝利数ランキング</h2>
        {archetypeRankingsData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archetypeRankingsData.map(data => <RankingSection key={data.title} {...data} />)}
          </div>
        ) : (
          !noWinsRecorded && <p className="text-muted-foreground">勝利記録のあるアーキタイプがありません。</p>
        )}
      </div>

      {noWinsRecorded && (
         <p className="text-center text-muted-foreground py-8">
           どのクラスまたはアーキタイプでも勝利記録がありません。
         </p>
      )}
    </div>
  );
}

