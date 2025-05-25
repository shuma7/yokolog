
"use client";

import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON } from "@/lib/game-data";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AggregatedStatsDisplayProps {
  matches: MatchData[];
  archetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

interface TurnStats {
  matches: number;
  wins: number;
  winRate: number;
}

interface ArchetypeAggregatedStats {
  archetypeId: string;
  archetypeName: string;
  archetypeAbbreviation: string;
  archetypeGameClass: GameClass;
  firstTurnStats: TurnStats;
  secondTurnStats: TurnStats;
}

interface TotalAggregatedStats {
  firstTurnStats: TurnStats;
  secondTurnStats: TurnStats;
}

function calculateStats(filteredMatches: MatchData[]): TurnStats {
  const wins = filteredMatches.filter(m => m.result === 'win').length;
  const losses = filteredMatches.filter(m => m.result === 'loss').length;
  // Draws are counted in total matches for WR denominator if we consider total games played
  // For win rate based on win/(win+loss), we use wins + losses for denominator
  const gamesForWinRate = wins + losses;
  return {
    matches: filteredMatches.length,
    wins: wins,
    winRate: gamesForWinRate > 0 ? parseFloat(((wins / gamesForWinRate) * 100).toFixed(1)) : 0,
  };
}

export function AggregatedStatsDisplay({ matches, archetypes, gameClassMapping }: AggregatedStatsDisplayProps) {
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">集計対象の対戦データがありません。</p>;
  }

  const totalStats: TotalAggregatedStats = {
    firstTurnStats: calculateStats(matches.filter(m => m.turn === 'first')),
    secondTurnStats: calculateStats(matches.filter(m => m.turn === 'second')),
  };

  const archetypeStats: ArchetypeAggregatedStats[] = archetypes
    .filter(arch => !arch.isDefault || arch.id === 'unknown') // Include user-added and 'unknown'
    .map(arch => {
      const userMatchesWithArchetype = matches.filter(m => m.userArchetypeId === arch.id);
      if (userMatchesWithArchetype.length === 0 && arch.id !== 'unknown') return null; // Only show if games played, unless it's 'unknown'

      return {
        archetypeId: arch.id,
        archetypeName: arch.name,
        archetypeAbbreviation: arch.abbreviation,
        archetypeGameClass: arch.gameClass,
        firstTurnStats: calculateStats(userMatchesWithArchetype.filter(m => m.turn === 'first')),
        secondTurnStats: calculateStats(userMatchesWithArchetype.filter(m => m.turn === 'second')),
      };
    })
    .filter(Boolean) as ArchetypeAggregatedStats[];
  
  // Sort archetypes by class then name for consistent display
  archetypeStats.sort((a, b) => {
    const classA = gameClassMapping[a.archetypeGameClass] || a.archetypeGameClass;
    const classB = gameClassMapping[b.archetypeGameClass] || b.archetypeGameClass;
    if (classA === classB) return a.archetypeName.localeCompare(b.archetypeName, 'ja');
    return classA.localeCompare(classB, 'ja');
  });


  const renderStatsRow = (label: string, stats: TurnStats, Icon?: React.ElementType) => (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {label}
        </div>
      </TableCell>
      <TableCell className="text-center">{stats.matches}</TableCell>
      <TableCell className="text-center">{stats.wins}</TableCell>
      <TableCell className="text-center">{stats.winRate}%</TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>総合集計</CardTitle>
          <CardDescription>全てのデッキタイプを合計した先攻・後攻別の戦績です。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ターン</TableHead>
                <TableHead className="text-center">試合数</TableHead>
                <TableHead className="text-center">勝利数</TableHead>
                <TableHead className="text-center">勝率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderStatsRow("先攻", totalStats.firstTurnStats)}
              {renderStatsRow("後攻", totalStats.secondTurnStats)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>デッキタイプ別集計</CardTitle>
          <CardDescription>自分の使用したデッキタイプ毎の先攻・後攻別戦績です。</CardDescription>
        </CardHeader>
        <CardContent>
          {archetypeStats.length === 0 && (
            <p className="text-center text-muted-foreground py-4">表示できるデッキタイプ別の集計データがありません。</p>
          )}
          <ScrollArea className={archetypeStats.length > 5 ? "h-[500px]" : ""}> {/* Add scroll if many archetypes */}
            <div className="space-y-4">
              {archetypeStats.map(stat => {
                 const ArchetypeIcon = stat.archetypeId === 'unknown' 
                    ? UNKNOWN_ARCHETYPE_ICON 
                    : CLASS_ICONS[stat.archetypeGameClass] || GENERIC_ARCHETYPE_ICON;
                return (
                <div key={stat.archetypeId} className="rounded-md border p-4">
                  <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                    <ArchetypeIcon className="h-5 w-5" />
                    {stat.archetypeName} ({stat.archetypeAbbreviation}) - {gameClassMapping[stat.archetypeGameClass]}
                  </h3>
                  {(stat.firstTurnStats.matches === 0 && stat.secondTurnStats.matches === 0) ? (
                     <p className="text-sm text-muted-foreground">このデッキタイプでの対戦記録はありません。</p>
                  ) : (
                  <Table size="sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ターン</TableHead>
                        <TableHead className="text-center">試合数</TableHead>
                        <TableHead className="text-center">勝利数</TableHead>
                        <TableHead className="text-center">勝率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderStatsRow("先攻", stat.firstTurnStats)}
                      {renderStatsRow("後攻", stat.secondTurnStats)}
                    </TableBody>
                  </Table>
                  )}
                </div>
              )})}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Add size prop to Table component for tighter spacing if needed (not standard ShadCN)
// For now, will use default TableCell/TableHead padding.
// Table.size = "sm" could be a custom prop if Shadcn Table supported it.
// Alternatively, apply custom padding classes to TableCell/TableHead in this component.
// For this implementation, keeping it simple.
