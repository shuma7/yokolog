
"use client";

import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from "@/lib/game-data";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AggregatedStatsDisplayProps {
  matches: MatchData[];
  archetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

// For internal calculations, keeps wins
interface InternalTurnStats {
  matches: number;
  wins: number;
  winRate: number;
}

// For display, omits wins
interface DisplayTurnStats {
  matches: number;
  winRate: number;
}

interface ArchetypeAggregatedStats {
  archetypeId: string;
  archetypeName: string;
  archetypeGameClass: GameClass;
  firstTurnStats: DisplayTurnStats;
  secondTurnStats: DisplayTurnStats;
  overallStats: DisplayTurnStats;
  totalMatchesPlayed: number; // For sorting
}

interface TotalAggregatedStats {
  firstTurnStats: DisplayTurnStats;
  secondTurnStats: DisplayTurnStats;
  overallStats: DisplayTurnStats;
}

function calculateInternalStats(filteredMatches: MatchData[]): InternalTurnStats {
  const wins = filteredMatches.filter(m => m.result === 'win').length;
  const losses = filteredMatches.filter(m => m.result === 'loss').length; // Only consider win/loss for win rate denominator
  const gamesForWinRate = wins + losses;
  return {
    matches: filteredMatches.length, // Total matches including those not win/loss if any in future
    wins: wins,
    winRate: gamesForWinRate > 0 ? parseFloat(((wins / gamesForWinRate) * 100).toFixed(1)) : 0,
  };
}

function toDisplayStats(internalStats: InternalTurnStats): DisplayTurnStats {
  return {
    matches: internalStats.matches,
    winRate: internalStats.winRate,
  };
}

export function AggregatedStatsDisplay({ matches, archetypes, gameClassMapping }: AggregatedStatsDisplayProps) {
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">集計対象の対戦データがありません。</p>;
  }

  const totalInternalFirstTurnStats = calculateInternalStats(matches.filter(m => m.turn === 'first'));
  const totalInternalSecondTurnStats = calculateInternalStats(matches.filter(m => m.turn === 'second'));
  const totalInternalOverallStats = calculateInternalStats(matches); // All matches for overall

  const totalStats: TotalAggregatedStats = {
    firstTurnStats: toDisplayStats(totalInternalFirstTurnStats),
    secondTurnStats: toDisplayStats(totalInternalSecondTurnStats),
    overallStats: toDisplayStats(totalInternalOverallStats),
  };

  const archetypeStats: ArchetypeAggregatedStats[] = archetypes
    .filter(arch => !arch.isDefault || arch.id === 'unknown') 
    .map(arch => {
      const userMatchesWithArchetype = matches.filter(m => m.userArchetypeId === arch.id);
      if (userMatchesWithArchetype.length === 0 && arch.id !== 'unknown') return null;

      const internalFirst = calculateInternalStats(userMatchesWithArchetype.filter(m => m.turn === 'first'));
      const internalSecond = calculateInternalStats(userMatchesWithArchetype.filter(m => m.turn === 'second'));
      const internalOverall = calculateInternalStats(userMatchesWithArchetype);


      return {
        archetypeId: arch.id,
        archetypeName: arch.name,
        archetypeGameClass: arch.gameClass,
        firstTurnStats: toDisplayStats(internalFirst),
        secondTurnStats: toDisplayStats(internalSecond),
        overallStats: toDisplayStats(internalOverall),
        totalMatchesPlayed: internalOverall.matches, // Use overall matches for sorting
      };
    })
    .filter(Boolean) as ArchetypeAggregatedStats[];

  // Sort archetypes by total matches played (descending)
  archetypeStats.sort((a, b) => b.totalMatchesPlayed - a.totalMatchesPlayed);


  const renderStatsRow = (label: string, stats: DisplayTurnStats, Icon?: React.ElementType) => (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {label}
        </div>
      </TableCell>
      <TableCell className="text-center">{stats.matches}</TableCell>
      <TableCell className="text-center">{stats.winRate}%</TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>総合集計</CardTitle>
          <CardDescription>全てのデッキタイプを合計した先攻・後攻・総合別の戦績です。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ターン</TableHead>
                <TableHead className="text-center">試合数</TableHead>
                <TableHead className="text-center">勝率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderStatsRow("先攻", totalStats.firstTurnStats)}
              {renderStatsRow("後攻", totalStats.secondTurnStats)}
              {renderStatsRow("総合", totalStats.overallStats)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>デッキタイプ別集計</CardTitle>
          <CardDescription>自分の使用したデッキタイプ毎の先攻・後攻・総合別戦績です。試合数が多い順に表示されます。</CardDescription>
        </CardHeader>
        <CardContent>
          {archetypeStats.length === 0 && (
            <p className="text-center text-muted-foreground py-4">表示できるデッキタイプ別の集計データがありません。</p>
          )}
          <ScrollArea className={archetypeStats.length > 3 ? "h-[600px]" : ""}> {/* Adjust scroll height based on items */}
            <div className="space-y-4">
              {archetypeStats.map(stat => {
                 const ArchetypeIcon = stat.archetypeId === 'unknown'
                    ? UNKNOWN_ARCHETYPE_ICON
                    : CLASS_ICONS[stat.archetypeGameClass] || GENERIC_ARCHETYPE_ICON;
                return (
                <div key={stat.archetypeId} className="rounded-md border p-4">
                  <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                    <ArchetypeIcon className="h-5 w-5" />
                    {formatArchetypeNameWithSuffix({id: stat.archetypeId, name: stat.archetypeName, gameClass: stat.archetypeGameClass})}
                  </h3>
                  {(stat.totalMatchesPlayed === 0) ? ( // Check total matches for the archetype
                     <p className="text-sm text-muted-foreground">このデッキタイプでの対戦記録はありません。</p>
                  ) : (
                  <Table size="sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ターン</TableHead>
                        <TableHead className="text-center">試合数</TableHead>
                        <TableHead className="text-center">勝率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderStatsRow("先攻", stat.firstTurnStats)}
                      {renderStatsRow("後攻", stat.secondTurnStats)}
                      {renderStatsRow("総合", stat.overallStats)}
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
