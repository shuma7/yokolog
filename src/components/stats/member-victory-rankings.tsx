
"use client";

import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { ALL_GAME_CLASSES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from "@/lib/game-data";
import { useMemo } from "react";

interface MemberVictoryRankingsProps {
  matches: MatchData[]; // Should be for a specific user, or all if global context
  allArchetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
  usernameForDisplay?: string; // To clarify whose rankings are shown
}

interface RankedItem {
  id: string;
  name: string;
  wins: number;
  icon?: React.ElementType;
  gameClass?: GameClass; 
}

export function MemberVictoryRankings({ matches, allArchetypes, gameClassMapping, usernameForDisplay }: MemberVictoryRankingsProps) {

  const archetypeRanking = useMemo(() => {
    const winsByArchetype: Record<string, { archetype: Archetype; wins: number }> = {};

    matches.forEach(match => {
      // Ensure match belongs to the user if usernameForDisplay is provided (though filtering happens before)
      // And result is a win for the user of these logs.
      if (match.result === 'win') { 
        const userArchetype = allArchetypes.find(a => a.id === match.userArchetypeId);
        if (userArchetype) {
          if (!winsByArchetype[userArchetype.id]) {
            winsByArchetype[userArchetype.id] = { archetype: userArchetype, wins: 0 };
          }
          winsByArchetype[userArchetype.id].wins++;
        }
      }
    });

    return Object.values(winsByArchetype)
      .filter(item => item.wins > 0)
      .map(item => {
        const Icon = item.archetype.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[item.archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
        return {
          id: item.archetype.id,
          name: formatArchetypeNameWithSuffix(item.archetype),
          wins: item.wins,
          icon: Icon,
          gameClass: item.archetype.gameClass,
        };
      })
      .sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        const classA = gameClassMapping[a.gameClass!] || a.gameClass!;
        const classB = gameClassMapping[b.gameClass!] || b.gameClass!;
        if (classA !== classB) {
          return classA.localeCompare(classB, 'ja');
        }
        return a.name.localeCompare(b.name, 'ja');
      });
  }, [matches, allArchetypes, gameClassMapping]);

  const classRanking = useMemo(() => {
    const winsByClass: Record<GameClass, number> = {} as Record<GameClass, number>;
    ALL_GAME_CLASSES.forEach(gc => winsByClass[gc.value] = 0);

    matches.forEach(match => {
      if (match.result === 'win') {
        const userArchetype = allArchetypes.find(a => a.id === match.userArchetypeId);
        if (userArchetype) {
          winsByClass[userArchetype.gameClass]++;
        }
      }
    });

    return ALL_GAME_CLASSES
      .map(gc => {
        const Icon = CLASS_ICONS[gc.value] || GENERIC_ARCHETYPE_ICON;
        return {
          id: gc.value,
          name: gc.label,
          wins: winsByClass[gc.value],
          icon: Icon,
        };
      })
      .filter(item => item.wins > 0)
      .sort((a, b) => b.wins - a.wins);
  }, [matches, allArchetypes]);

  if (matches.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {usernameForDisplay ? `${usernameForDisplay}さんの` : ""}集計対象の対戦データがありません。
      </p>
    );
  }
  
  const renderRankingTable = (title: string, description: string, rankingData: RankedItem[], type: 'archetype' | 'class') => (
    <div className="mb-6"> {/* Replaced Card with div for styling within parent Card */}
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
                <TableHead className="sticky top-0 bg-card w-[80px] text-center">順位</TableHead>
                <TableHead className="sticky top-0 bg-card">{type === 'archetype' ? "デッキタイプ名" : "クラス名"}</TableHead>
                <TableHead className="sticky top-0 bg-card text-right">勝利数</TableHead>
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
                  <TableCell className="text-right font-semibold">{item.wins}勝</TableCell>
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
    <div className="space-y-4"> {/* Changed space-y-6 to space-y-4 for tighter layout */}
      {renderRankingTable(
        "アーキタイプ別 勝利数",
        `${usernameForDisplay || "選択ユーザー"}の使用デッキタイプ別総勝利数です。`,
        archetypeRanking,
        'archetype'
      )}
      {renderRankingTable(
        "クラス別 勝利数",
        `${usernameForDisplay || "選択ユーザー"}の使用クラス別総勝利数です。`,
        classRanking,
        'class'
      )}
    </div>
  );
}
