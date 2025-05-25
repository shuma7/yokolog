
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { ALL_GAME_CLASSES } from '@/types'; // Import ALL_GAME_CLASSES
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

  const sortedArchetypes = useMemo(() => {
    const getClassOrder = (gameClass: GameClass): number => {
      const index = ALL_GAME_CLASSES.findIndex(gc => gc.value === gameClass);
      return index === -1 ? ALL_GAME_CLASSES.length : index; // Put unknown classes last if any
    };

    return [...allArchetypes].sort((a, b) => {
      // Sort "unknown" archetype to the very end
      if (a.id === 'unknown' && b.id !== 'unknown') return 1;
      if (a.id !== 'unknown' && b.id === 'unknown') return -1;
      if (a.id === 'unknown' && b.id === 'unknown') return 0;

      const classOrderA = getClassOrder(a.gameClass);
      const classOrderB = getClassOrder(b.gameClass);

      if (classOrderA !== classOrderB) {
        return classOrderA - classOrderB;
      }
      // If same class, sort by name
      return a.name.localeCompare(b.name, 'ja');
    });
  }, [allArchetypes]);

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
      // Re-sort based on the original sortedArchetypes list to maintain consistent order
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

        if (rowArch.id === colArch.id) { // Mirror match calculation
          matches.forEach(match => {
            // Process only if this match is between the current mirror archetype
            if (match.userArchetypeId === rowArch.id && match.opponentArchetypeId === colArch.id) {
              // User's perspective (rowArch)
              overallItems.push({ result: match.result });
              if (match.turn === 'first') {
                firstTurnItems.push({ result: match.result });
              } else if (match.turn === 'second') {
                secondTurnItems.push({ result: match.result });
              }

              // Implied opponent's perspective (also rowArch because it's a mirror)
              overallItems.push({ result: match.result === 'win' ? 'loss' : 'win' });
              if (match.turn === 'first') { // User went first, so opponent (rowArch) went second
                secondTurnItems.push({ result: match.result === 'win' ? 'loss' : 'win' });
              } else if (match.turn === 'second') { // User went second, so opponent (rowArch) went first
                firstTurnItems.push({ result: match.result === 'win' ? 'loss' : 'win' });
              }
            }
          });
        } else { // Non-mirror match calculation (symmetrical)
          matches.forEach(match => {
            let perspectiveResult: 'win' | 'loss' | null = null;
            let perspectiveTurn: 'first' | 'second' | 'unknown' | null = null;

            if (match.userArchetypeId === rowArch.id && match.opponentArchetypeId === colArch.id) {
              perspectiveResult = match.result;
              perspectiveTurn = match.turn;
            }
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
        }
        
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
        <div className="flex items-center justify-center h-full p-0.5"> {/* Reduced padding */}
          <span className="text-muted-foreground text-[10px]">-</span> {/* Smaller text */}
        </div>
      );
    }

    const overallWinRate = stats.overall.winRate;
    let cellBgClass = "hover:bg-muted/50";
    if (stats.overall.gamesPlayed > 0) {
      if (userArchForPopover.id !== oppArchForPopover?.id) { // Only color non-mirror matches
        if (overallWinRate >= 55) cellBgClass = "bg-blue-600/20 hover:bg-blue-600/30";
        else if (overallWinRate <= 45) cellBgClass = "bg-red-600/20 hover:bg-red-600/30";
      } else { // Mirror match cell styling
        cellBgClass = "bg-muted/30 hover:bg-muted/50";
      }
    }
    
    const popoverTitle = oppArchForPopover 
      ? `${formatArchetypeNameWithSuffix(userArchForPopover)} vs ${formatArchetypeNameWithSuffix(oppArchForPopover)}`
      : `${formatArchetypeNameWithSuffix(userArchForPopover)} - 総合戦績`;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className={cn("flex flex-col items-center justify-center text-[10px] cursor-pointer p-0.5 h-full w-full leading-tight", cellBgClass)}> {/* Reduced padding, smaller text, tighter leading */}
            <span title={`先攻: ${stats.first.winRate}% (${stats.first.wins}勝${stats.first.losses}敗)`}>
              先: {stats.first.winRate}%
            </span>
            <span title={`後攻: ${stats.second.winRate}% (${stats.second.wins}勝${stats.second.losses}敗)`}>
              後: {stats.second.winRate}%
            </span>
            <span className="font-semibold text-xs" title={`総合: ${stats.overall.winRate}% (${stats.overall.wins}勝${stats.overall.losses}敗)`}>
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
    )
  };


  return (
    <Card>
      <CardHeader className="p-2.5"> {/* Reduced padding */}
        <CardTitle>デッキタイプ相性表</CardTitle>
        <CardDescription className="text-xs"> {/* Smaller text */}
          記録されたゲームに基づくデッキタイプ間の勝率です。下のボタンで表示するデッキタイプを選択し、表のセルをタップすると詳細が表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1.5"> {/* Reduced padding */}
        <div className="mb-2.5"> {/* Reduced margin */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto text-[11px] h-8 px-2.5"> {/* Smaller text and height */}
                表示するデッキタイプを選択 ({selectedArchetypeIds.length} / {availableArchetypesForFilter.length})
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" /> {/* Smaller icon */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start"> {/* Slightly narrower dropdown */}
              <ScrollArea className="h-[280px]"> {/* Slightly shorter scroll area */}
                <DropdownMenuLabel className="text-xs">表示するデッキタイプ</DropdownMenuLabel> {/* Smaller label */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setSelectedArchetypeIds(availableArchetypesForFilter.map(a => a.id))}
                  className="cursor-pointer text-xs" /* Smaller text */
                >
                  全て選択
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSelectedArchetypeIds([])}
                  className="cursor-pointer text-xs" /* Smaller text */
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
                      className="text-xs" /* Smaller text */
                    >
                      <Icon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> {/* Smaller icon */}
                      {formatArchetypeNameWithSuffix(archetype)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {displayArchetypes.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">表示するデッキタイプが選択されていません。</p> {/* Smaller text */}
        ) : (
          <div className="overflow-auto rounded-md border max-h-[calc(100vh-210px)]"> {/* Adjusted max-h due to reduced padding */}
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-20 bg-card min-w-[100px] w-[100px] p-0.5"> {/* Reduced width & padding */}
                    <span className="text-[10px] text-muted-foreground block text-right -mb-1">相手</span>
                    <span className="text-[10px] text-muted-foreground block text-left -mt-1 ml-0.5">自分</span> {/* Adjusted ml */}
                    <div className="w-full border-b border-border transform rotate-[335deg] translate-y-[-10px] translate-x-[1px]"></div> {/* Adjusted transform */}
                  </TableHead>
                  {displayArchetypes.map(oppArch => {
                    const OppIcon = oppArch.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[oppArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                    return (
                      <TableHead key={oppArch.id} className="sticky top-0 z-10 bg-card text-center min-w-[70px] p-0.5"> {/* Reduced width & padding */}
                        <div className="flex flex-col items-center">
                          <OppIcon className="h-3.5 w-3.5 mb-0.5" /> {/* Smaller icon */}
                          <span className="text-[9px] leading-tight break-all">{formatArchetypeNameWithSuffix(oppArch)}</span> {/* Even smaller font, break-all */}
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="sticky top-0 z-10 bg-card text-center min-w-[70px] p-0.5"> {/* "Total" Header, sticky top, reduced width & padding */}
                    <div className="flex flex-col items-center">
                       <span className="text-[9px] font-semibold leading-tight">合計</span> {/* Smaller font */}
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
                      <TableCell className="sticky left-0 z-10 bg-card font-medium min-w-[100px] w-[100px] p-0.5"> {/* Reduced width & padding */}
                        <div className="flex items-center gap-0.5"> {/* Reduced gap */}
                          <UserIcon className="h-3.5 w-3.5" /> {/* Smaller icon */}
                          <span className="text-[10px] leading-tight break-all">{formatArchetypeNameWithSuffix(userArch)}</span> {/* Smaller font, break-all */}
                        </div>
                      </TableCell>
                      {displayArchetypes.map(oppArch => {
                        const matchupStats = matchupData[userArch.id]?.[oppArch.id];
                        return (
                          <TableCell key={oppArch.id} className="p-0 min-w-[70px]"> {/* Reduced width */}
                            {renderStatsCell(matchupStats, userArch, oppArch)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="p-0 min-w-[70px] bg-card"> {/* "Total" Data Cell, reduced width */}
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
    
