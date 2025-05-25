
"use client";

import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { ALL_GAME_CLASSES } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from "@/lib/game-data";
import { useMemo } from "react";

interface UserWinDetail {
  username: string;
  wins: number;
}

interface RankedItemWithUserWins {
  id: string; // Archetype ID or Class Value
  name: string; // Archetype Name or Class Label
  totalWins: number;
  userWins: UserWinDetail[];
  icon?: React.ElementType;
  gameClass?: GameClass; // Only for archetype ranking
}

interface MemberVictoryRankingsProps {
  matches: MatchData[];
  allArchetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

export function MemberVictoryRankings({ matches, allArchetypes, gameClassMapping }: MemberVictoryRankingsProps) {

  const archetypeRanking = useMemo(() => {
    const winsByArchetype: Record<string, { archetype: Archetype; userWins: Record<string, number>; totalWins: number }> = {};

    matches.forEach(match => {
      if (match.result === 'win' && match.userId) {
        const userArchetype = allArchetypes.find(a => a.id === match.userArchetypeId);
        if (userArchetype) {
          if (!winsByArchetype[userArchetype.id]) {
            winsByArchetype[userArchetype.id] = { archetype: userArchetype, userWins: {}, totalWins: 0 };
          }
          winsByArchetype[userArchetype.id].userWins[match.userId] = (winsByArchetype[userArchetype.id].userWins[match.userId] || 0) + 1;
          winsByArchetype[userArchetype.id].totalWins++;
        }
      }
    });

    return Object.values(winsByArchetype)
      .filter(item => item.totalWins > 0)
      .map(item => {
        const Icon = item.archetype.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[item.archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
        const userWinDetails: UserWinDetail[] = Object.entries(item.userWins)
          .map(([username, wins]) => ({ username, wins }))
          .sort((a, b) => b.wins - a.wins);
        
        return {
          id: item.archetype.id,
          name: formatArchetypeNameWithSuffix(item.archetype),
          totalWins: item.totalWins,
          userWins: userWinDetails,
          icon: Icon,
          gameClass: item.archetype.gameClass,
        };
      })
      .sort((a, b) => {
        if (b.totalWins !== a.totalWins) {
          return b.totalWins - a.totalWins;
        }
        // Ensure gameClass exists before accessing it for sorting
        const classA = a.gameClass ? (gameClassMapping[a.gameClass] || a.gameClass) : '';
        const classB = b.gameClass ? (gameClassMapping[b.gameClass] || b.gameClass) : '';
        
        if (classA !== classB) {
          return classA.localeCompare(classB, 'ja');
        }
        return a.name.localeCompare(b.name, 'ja');
      });
  }, [matches, allArchetypes, gameClassMapping]);

  const classRanking = useMemo(() => {
    const winsByClass: Record<GameClass, { userWins: Record<string, number>; totalWins: number }> = {} as Record<GameClass, { userWins: Record<string, number>; totalWins: number }>;
    ALL_GAME_CLASSES.forEach(gc => winsByClass[gc.value] = { userWins: {}, totalWins: 0 });

    matches.forEach(match => {
      if (match.result === 'win' && match.userId) {
        const userArchetype = allArchetypes.find(a => a.id === match.userArchetypeId);
        if (userArchetype && userArchetype.gameClass && winsByClass[userArchetype.gameClass]) {
          winsByClass[userArchetype.gameClass].userWins[match.userId] = (winsByClass[userArchetype.gameClass].userWins[match.userId] || 0) + 1;
          winsByClass[userArchetype.gameClass].totalWins++;
        }
      }
    });

    return ALL_GAME_CLASSES
      .map(gc => {
        const Icon = CLASS_ICONS[gc.value] || GENERIC_ARCHETYPE_ICON;
        const userWinDetails: UserWinDetail[] = Object.entries(winsByClass[gc.value].userWins)
          .map(([username, wins]) => ({ username, wins }))
          .sort((a, b) => b.wins - a.wins);

        return {
          id: gc.value,
          name: gc.label,
          totalWins: winsByClass[gc.value].totalWins,
          userWins: userWinDetails,
          icon: Icon,
        };
      })
      .filter(item => item.totalWins > 0)
      .sort((a, b) => b.totalWins - a.totalWins);
  }, [matches, allArchetypes]);

  if (matches.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        集計対象の対戦データがありません。
      </p>
    );
  }
  
  const formatUserWins = (userWins: UserWinDetail[]) => {
    if (userWins.length === 0) return "-";
    return userWins.map(uw => `${uw.username}: ${uw.wins}勝`).join(', ');
  };

  const renderRankingTable = (title: string, description: string, rankingData: RankedItemWithUserWins[], type: 'archetype' | 'class') => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {rankingData.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          {type === 'archetype' ? "勝利記録のあるデッキタイプがありません。" : "勝利記録のあるクラスがありません。"}
        </p>
      ) : (
        <div className="rounded-md border max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card w-[60px] text-center">順位</TableHead>
                <TableHead className="sticky top-0 bg-card min-w-[150px]">{type === 'archetype' ? "デッキタイプ名" : "クラス名"}</TableHead>
                <TableHead className="sticky top-0 bg-card min-w-[200px]">ユーザー別勝利数</TableHead>
                <TableHead className="sticky top-0 bg-card text-right w-[100px]">合計勝利数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />}
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatUserWins(item.userWins)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{item.totalWins}勝</TableCell>
                </TableRow>
              ))}
            </TableBody>
             {rankingData.length === 0 && (
              <TableCaption>表示できるデータがありません。</TableCaption>
            )}
          </Table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {renderRankingTable(
        "クラス別 勝利数ランキング",
        "各クラスでのユーザー別総勝利数です。",
        classRanking,
        'class'
      )}
      {renderRankingTable(
        "アーキタイプ別 勝利数ランキング",
        "各デッキタイプでのユーザー別総勝利数です。",
        archetypeRanking,
        'archetype'
      )}
    </div>
  );
}

