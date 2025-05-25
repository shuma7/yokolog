
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from "@/lib/game-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface MatchupTableDisplayProps {
  matches: MatchData[];
  allArchetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

interface TurnSpecificStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
}

interface MatchupDetailStats {
  overall: TurnSpecificStats;
  first: TurnSpecificStats;
  second: TurnSpecificStats;
}

// Helper to calculate basic win/loss stats from a list of results
const calculateRawStats = (items: Array<{ result: 'win' | 'loss' }>): TurnSpecificStats => {
  const wins = items.filter(i => i.result === 'win').length;
  const losses = items.filter(i => i.result === 'loss').length;
  const gamesPlayed = wins + losses;
  return {
    wins,
    losses,
    gamesPlayed,
    winRate: gamesPlayed > 0 ? parseFloat(((wins / gamesPlayed) * 100).toFixed(1)) : 0,
  };
};


export function MatchupTableDisplay({ matches, allArchetypes, gameClassMapping }: MatchupTableDisplayProps) {
  const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<string[]>([]);

  const sortedArchetypes = useMemo(() =>
    [...allArchetypes].sort((a, b) => {
      if (a.id === 'unknown') return -1;
      if (b.id === 'unknown') return 1;
      const classA = gameClassMapping[a.gameClass] || a.gameClass;
      const classB = gameClassMapping[b.gameClass] || b.gameClass;
      if (classA === classB) return a.name.localeCompare(b.name, 'ja');
      return classA.localeCompare(classB, 'ja');
    }), [allArchetypes, gameClassMapping]);

  const availableArchetypesForFilter = useMemo(() => {
    const idsInMatches = new Set<string>();
    matches.forEach(m => {
      idsInMatches.add(m.userArchetypeId);
      idsInMatches.add(m.opponentArchetypeId);
    });
    return sortedArchetypes.filter(a => idsInMatches.has(a.id));
  }, [matches, sortedArchetypes]);

  useEffect(() => {
    if (availableArchetypesForFilter.length > 0) {
      setSelectedArchetypeIds(availableArchetypesForFilter.map(a => a.id));
    }
  }, [availableArchetypesForFilter]);

  const displayArchetypes = useMemo(() => {
    return availableArchetypesForFilter
      .filter(a => selectedArchetypeIds.includes(a.id))
      .sort((a,b) => sortedArchetypes.findIndex(s => s.id === a.id) - sortedArchetypes.findIndex(s => s.id === b.id));
  }, [availableArchetypesForFilter, selectedArchetypeIds, sortedArchetypes]);


  const matchupData = useMemo(() => {
    const data: Record<string, Record<string, MatchupDetailStats>> = {};

    displayArchetypes.forEach(rowArch => {
      data[rowArch.id] = {};
      displayArchetypes.forEach(colArch => {
        const overallItems: Array<{ result: 'win' | 'loss' }> = [];
        const firstTurnItems: Array<{ result: 'win' | 'loss' }> = [];
        const secondTurnItems: Array<{ result: 'win' | 'loss' }> = [];

        matches.forEach(match => {
          let perspectiveResult: 'win' | 'loss' | null = null;
          let perspectiveTurn: 'first' | 'second' | 'unknown' | null = null;

          // Case 1: rowArch is user, colArch is opponent
          if (match.userArchetypeId === rowArch.id && match.opponentArchetypeId === colArch.id) {
            perspectiveResult = match.result;
            perspectiveTurn = match.turn;
          }
          // Case 2: colArch is user, rowArch is opponent (invert result and turn)
          else if (match.userArchetypeId === colArch.id && match.opponentArchetypeId === rowArch.id) {
            perspectiveResult = match.result === 'win' ? 'loss' : 'win';
            if (match.turn === 'first') perspectiveTurn = 'second';
            else if (match.turn === 'second') perspectiveTurn = 'first';
            else perspectiveTurn = 'unknown';
          }

          if (perspectiveResult) {
            overallItems.push({ result: perspectiveResult });
            if (perspectiveTurn === 'first') {
              firstTurnItems.push({ result: perspectiveResult });
            } else if (perspectiveTurn === 'second') {
              secondTurnItems.push({ result: perspectiveResult });
            }
          }
        });
        
        data[rowArch.id][colArch.id] = {
          overall: calculateRawStats(overallItems),
          first: calculateRawStats(firstTurnItems),
          second: calculateRawStats(secondTurnItems),
        };
      });
    });
    return data;
  }, [matches, displayArchetypes]);

  const archetypeOverallPerformance = useMemo(() => {
    const performance: Record<string, MatchupDetailStats> = {};
    displayArchetypes.forEach(arch => {
      const overallItems: Array<{ result: 'win' | 'loss' }> = [];
      const firstTurnItems: Array<{ result: 'win' | 'loss' }> = [];
      const secondTurnItems: Array<{ result: 'win' | 'loss' }> = [];

      matches.forEach(match => {
        let resultForPerspective: 'win' | 'loss' | null = null;
        let turnForPerspective: 'first' | 'second' | 'unknown' | null = null;

        if (match.userArchetypeId === arch.id) {
          resultForPerspective = match.result;
          turnForPerspective = match.turn;
        } else if (match.opponentArchetypeId === arch.id) {
          resultForPerspective = match.result === 'win' ? 'loss' : 'win';
          turnForPerspective = match.turn === 'first' ? 'second' : (match.turn === 'second' ? 'first' : 'unknown');
        }

        if (resultForPerspective) {
          overallItems.push({ result: resultForPerspective });
          if (turnForPerspective === 'first') {
            firstTurnItems.push({ result: resultForPerspective });
          } else if (turnForPerspective === 'second') {
            secondTurnItems.push({ result: resultForPerspective });
          }
        }
      });
      performance[arch.id] = {
        overall: calculateRawStats(overallItems),
        first: calculateRawStats(firstTurnItems),
        second: calculateRawStats(secondTurnItems),
      };
    });
    return performance;
  }, [matches, displayArchetypes]);


  if (matches.length === 0 && allArchetypes.filter(a => !a.isDefault).length === 0) {
    return <p className="text-center text-muted-foreground py-8">対戦データがありません。まずは対戦記録とデッキタイプを登録しましょう。</p>;
  }
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">対戦データがありません。対戦を記録してください。</p>;
  }

  const renderStatsCell = (stats: MatchupDetailStats | undefined, userArchForPopover: Archetype, oppArchForPopover?: Archetype) => {
    if (!stats || stats.overall.gamesPlayed === 0) {
      return (
        <div className="flex items-center justify-center h-full p-2">
          <span className="text-muted-foreground text-xs">-</span>
        </div>
      );
    }

    const overallWinRate = stats.overall.winRate;
    let cellBgClass = "hover:bg-muted/50";
    if (stats.overall.gamesPlayed > 0) {
      if (overallWinRate >= 55) cellBgClass = "bg-blue-600/20 hover:bg-blue-600/30";
      else if (overallWinRate <= 45) cellBgClass = "bg-red-600/20 hover:bg-red-600/30";
    }
    
    const popoverTitle = oppArchForPopover 
      ? `${formatArchetypeNameWithSuffix(userArchForPopover)} vs ${formatArchetypeNameWithSuffix(oppArchForPopover)}`
      : `${formatArchetypeNameWithSuffix(userArchForPopover)} - 総合戦績`;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className={cn("flex flex-col items-center justify-center text-xs cursor-pointer p-2 h-full w-full", cellBgClass)}>
            <span title={`先攻: ${stats.first.winRate}% (${stats.first.wins}勝${stats.first.losses}敗)`}>
              先: {stats.first.winRate}%
            </span>
            <span title={`後攻: ${stats.second.winRate}% (${stats.second.wins}勝${stats.second.losses}敗)`}>
              後: {stats.second.winRate}%
            </span>
            <span className="font-semibold text-sm" title={`総合: ${stats.overall.winRate}% (${stats.overall.wins}勝${stats.overall.losses}敗)`}>
              計: {stats.overall.winRate}%
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 text-xs shadow-lg">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm mb-1">{popoverTitle}</h4>
            <p>総合: {stats.overall.wins}勝 {stats.overall.losses}敗 ({stats.overall.gamesPlayed}試合)</p>
            <p>先攻: {stats.first.wins}勝 {stats.first.losses}敗 ({stats.first.gamesPlayed}試合)</p>
            <p>後攻: {stats.second.wins}勝 {stats.second.losses}敗 ({stats.second.gamesPlayed}試合)</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>デッキタイプ相性表</CardTitle>
        <CardDescription>
          記録されたゲームに基づくデッキタイプ間の勝率です。下のボタンで表示するデッキタイプを選択し、表のセルをタップすると詳細が表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                表示するデッキタイプを選択 ({selectedArchetypeIds.length} / {availableArchetypesForFilter.length})
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="start">
              <ScrollArea className="h-[300px]">
                <DropdownMenuLabel>表示するデッキタイプ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setSelectedArchetypeIds(availableArchetypesForFilter.map(a => a.id))}
                  className="cursor-pointer"
                >
                  全て選択
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSelectedArchetypeIds([])}
                  className="cursor-pointer"
                >
                  全て解除
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableArchetypesForFilter.map(archetype => {
                  const Icon = archetype.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
                  return (
                    <DropdownMenuCheckboxItem
                      key={archetype.id}
                      checked={selectedArchetypeIds.includes(archetype.id)}
                      onCheckedChange={(checked) => {
                        setSelectedArchetypeIds(prev =>
                          checked ? [...prev, archetype.id] : prev.filter(id => id !== archetype.id)
                        );
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatArchetypeNameWithSuffix(archetype)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {displayArchetypes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">表示するデッキタイプが選択されていません。</p>
        ) : (
          <div className="overflow-auto rounded-md border max-h-[calc(100vh-300px)]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-20 bg-card min-w-[180px] w-[180px]">
                    <span className="text-xs text-muted-foreground block text-right -mb-1">相手</span>
                    <span className="text-xs text-muted-foreground block text-left -mt-1 ml-1">自分</span>
                    <div className="w-full border-b border-border transform rotate-[335deg] translate-y-[-13px] translate-x-[2px]"></div>
                  </TableHead>
                  {displayArchetypes.map(oppArch => {
                    const OppIcon = oppArch.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[oppArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                    return (
                      <TableHead key={oppArch.id} className="sticky top-0 z-10 bg-card text-center min-w-[120px] p-2">
                        <div className="flex flex-col items-center">
                          <OppIcon className="h-5 w-5 mb-1" />
                          <span className="text-xs">{formatArchetypeNameWithSuffix(oppArch)}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="sticky top-0 right-0 z-10 bg-card text-center min-w-[120px] p-2">
                    <div className="flex flex-col items-center">
                       {/* Placeholder for icon if needed */}
                      <span className="text-sm font-semibold">合計</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayArchetypes.map(userArch => {
                  const UserIcon = userArch.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[userArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                  const totalStatsForUserArch = archetypeOverallPerformance[userArch.id];
                  return (
                    <TableRow key={userArch.id}>
                      <TableCell className="sticky left-0 z-10 bg-card font-medium min-w-[180px] w-[180px] p-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          <span className="text-sm">{formatArchetypeNameWithSuffix(userArch)}</span>
                        </div>
                      </TableCell>
                      {displayArchetypes.map(oppArch => {
                        const matchupStats = matchupData[userArch.id]?.[oppArch.id];
                         // For diagonal cells (User vs User), display '-' or specific mirror match stats if desired
                        if (userArch.id === oppArch.id) {
                           return (
                            <TableCell key={oppArch.id} className="p-0 min-w-[120px] bg-muted/30">
                               {renderStatsCell(matchupStats, userArch, oppArch)}
                            </TableCell>
                           );
                        }
                        return (
                          <TableCell key={oppArch.id} className="p-0 min-w-[120px]">
                            {renderStatsCell(matchupStats, userArch, oppArch)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="sticky right-0 z-10 bg-card p-0 min-w-[120px]">
                         {renderStatsCell(totalStatsForUserArch, userArch)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    