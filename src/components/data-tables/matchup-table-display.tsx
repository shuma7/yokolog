
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { ALL_GAME_CLASSES } from '@/types';
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
      return index === -1 ? ALL_GAME_CLASSES.length : index;
    };

    const filteredArchetypes = allArchetypes.filter(a => a.id !== 'unknown');

    return [...filteredArchetypes].sort((a, b) => {
      const classOrderA = getClassOrder(a.gameClass);
      const classOrderB = getClassOrder(b.gameClass);

      if (classOrderA !== classOrderB) {
        return classOrderA - classOrderB;
      }
      return a.name.localeCompare(b.name, 'ja');
    });
  }, [allArchetypes]);

  const availableArchetypesForFilter = useMemo(() => {
    const idsInMatches = new Set<string>();
    matches.forEach(m => {
      if (m.userArchetypeId !== 'unknown') idsInMatches.add(m.userArchetypeId);
      if (m.opponentArchetypeId !== 'unknown') idsInMatches.add(m.opponentArchetypeId);
    });
    return sortedArchetypes.filter(a => idsInMatches.has(a.id) && a.id !== 'unknown');
  }, [matches, sortedArchetypes]);

  useEffect(() => {
    if (availableArchetypesForFilter.length > 0) {
       setSelectedArchetypeIds(availableArchetypesForFilter.map(a => a.id));
    } else {
       setSelectedArchetypeIds([]);
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

        if (rowArch.id === colArch.id) { 
            matches.forEach(match => {
                if (match.userArchetypeId === rowArch.id && match.opponentArchetypeId === colArch.id) {
                    overallItems.push({ result: match.result });
                    overallItems.push({ result: match.result === 'win' ? 'loss' : 'win' }); 
                    if (match.turn === 'first') {
                        firstTurnItems.push({ result: match.result });
                        secondTurnItems.push({ result: match.result === 'win' ? 'loss' : 'win' });
                    } else if (match.turn === 'second') {
                        secondTurnItems.push({ result: match.result });
                        firstTurnItems.push({ result: match.result === 'win' ? 'loss' : 'win' });
                    }
                }
            });
        } else { 
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

        if (match.userArchetypeId === arch.id && displayArchetypes.some(da => da.id === match.opponentArchetypeId)) {
            resultForPerspective = match.result;
            turnForPerspective = match.turn;
        } else if (match.opponentArchetypeId === arch.id && displayArchetypes.some(da => da.id === match.userArchetypeId)) {
            resultForPerspective = match.result === 'win' ? 'loss' : 'win';
            if (match.turn === 'first') turnForPerspective = 'second';
            else if (match.turn === 'second') turnForPerspective = 'first';
            else turnForPerspective = 'unknown';
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


  if (matches.length === 0 && allArchetypes.filter(a => a.id !== 'unknown' && !a.isDefault).length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-xs">対戦データがありません。まずは対戦記録とデッキタイプを登録しましょう。</p>;
  }
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-xs">対戦データがありません。対戦を記録してください。</p>;
  }
  if (availableArchetypesForFilter.length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-xs">相性表に表示できる対戦記録のあるデッキタイプがありません。「不明な相手」以外のデッキタイプとの対戦を記録してください。</p>;
  }

  const renderStatsCell = (stats: MatchupDetailStats | undefined, userArchForPopover: Archetype, oppArchForPopover?: Archetype) => {
    if (!stats || stats.overall.gamesPlayed === 0) {
      return (
        <div className="flex items-center justify-center h-full py-1.5"> 
          <span className="text-muted-foreground text-[8px]">-</span>
        </div>
      );
    }

    const overallWinRate = stats.overall.winRate;
    let cellBgClass = "hover:bg-muted/50";
    if (stats.overall.gamesPlayed > 0) {
      if (oppArchForPopover && userArchForPopover.id === oppArchForPopover.id) {
        cellBgClass = "bg-muted/30 hover:bg-muted/50"; 
      } else if (oppArchForPopover) { 
        if (overallWinRate >= 55) cellBgClass = "bg-blue-600/20 hover:bg-blue-600/30";
        else if (overallWinRate <= 45) cellBgClass = "bg-red-600/20 hover:bg-red-600/30";
      }
    }
    
    const popoverTitle = oppArchForPopover
      ? `${formatArchetypeNameWithSuffix(userArchForPopover)} vs ${formatArchetypeNameWithSuffix(oppArchForPopover)}`
      : `${formatArchetypeNameWithSuffix(userArchForPopover)} - 総合戦績`;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className={cn("flex flex-col items-center justify-center cursor-pointer h-full w-full leading-tight py-1.5", cellBgClass)}> 
            <span title={`先攻: ${stats.first.winRate}% (${stats.first.wins}勝${stats.first.losses}敗)`} className="text-[9px]"> 
              先: {stats.first.winRate}%
            </span>
            <span title={`後攻: ${stats.second.winRate}% (${stats.second.wins}勝${stats.second.losses}敗)`} className="text-[9px]"> 
              後: {stats.second.winRate}%
            </span>
            <span className="font-semibold text-[10px]" title={`総合: ${stats.overall.winRate}% (${stats.overall.wins}勝${stats.overall.losses}敗)`}> 
              計: {stats.overall.winRate}%
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5 text-xs shadow-lg"> 
          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm mb-0.5">{popoverTitle}</h4>
            <p>総合: {stats.overall.wins}勝 {stats.overall.losses}敗 ({stats.overall.gamesPlayed}試合)</p>
            <p>先攻: {stats.first.wins}勝 {stats.first.losses}敗 ({stats.first.gamesPlayed}試合)</p>
            <p>後攻: {stats.second.wins}勝 {stats.second.losses}敗 ({stats.second.gamesPlayed}試合)</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card>
      <CardHeader className="p-1"> 
        <CardTitle className="text-base">デッキタイプ相性表</CardTitle> 
        <CardDescription className="text-[10px]"> 
          記録されたゲームに基づくデッキタイプ間の勝率です。下のボタンで表示するデッキタイプを選択し、表のセルをタップすると詳細が表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-1 px-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto text-[10px] h-6 px-1.5 py-0.5">
                表示するデッキタイプを選択 ({selectedArchetypeIds.length} / {availableArchetypesForFilter.length})
                <ChevronDown className="ml-1 h-2.5 w-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="start">
              <ScrollArea className="h-[200px]">
                <DropdownMenuLabel className="text-xs">表示するデッキタイプ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setSelectedArchetypeIds(availableArchetypesForFilter.map(a => a.id))}
                  className="cursor-pointer text-xs"
                >
                  全て選択
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSelectedArchetypeIds([])}
                  className="cursor-pointer text-xs"
                >
                  全て解除
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableArchetypesForFilter.map(archetype => {
                  const Icon = CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
                  return (
                    <DropdownMenuCheckboxItem
                      key={archetype.id}
                      checked={selectedArchetypeIds.includes(archetype.id)}
                      onCheckedChange={(checked) => {
                        setSelectedArchetypeIds(prev =>
                          checked ? [...prev, archetype.id] : prev.filter(id => id !== archetype.id)
                        );
                      }}
                      className="text-xs"
                    >
                      <Icon className="mr-1 h-3 w-3 text-muted-foreground" />
                      {formatArchetypeNameWithSuffix(archetype)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {displayArchetypes.length === 0 ? (
          <p className="text-center text-muted-foreground py-3 text-xs">表示するデッキタイプが選択されていません。</p>
        ) : (
          <div className="overflow-auto rounded-md border max-h-[calc(100vh-180px)] relative">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-30 bg-card min-w-[60px] w-[60px] p-0.5">
                    <span className="text-[8px] text-muted-foreground block text-right -mb-1.5">相手</span>
                    <span className="text-[8px] text-muted-foreground block text-left -mt-1.5 ml-0.5">自分</span>
                    <div className="w-full border-b border-border transform rotate-[335deg] translate-y-[-7px] translate-x-[0.5px]"></div>
                  </TableHead>
                  {displayArchetypes.map(oppArch => {
                    const OppIcon = CLASS_ICONS[oppArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                    return (
                      <TableHead key={oppArch.id} className="bg-card text-center min-w-[45px] p-0.5">
                        <div className="flex flex-col items-center">
                          <OppIcon className="h-3 w-3 mb-0.5" />
                          <span className="text-[9px] leading-tight break-all">{formatArchetypeNameWithSuffix(oppArch)}</span> 
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="bg-card text-center min-w-[45px] p-0.5">
                    <div className="flex flex-col items-center">
                       <span className="text-[9px] font-semibold leading-tight">合計</span> 
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayArchetypes.map(userArch => {
                  const UserIcon = CLASS_ICONS[userArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                  const totalStatsForUserArch = archetypeOverallPerformance[userArch.id];
                  return (
                    <TableRow key={userArch.id}>
                      <TableCell className="sticky left-0 z-10 bg-card font-medium min-w-[60px] w-[60px] p-0.5">
                        <div className="flex items-center gap-0.5">
                          <UserIcon className="h-3 w-3" />
                          <span className="text-[10px] leading-tight break-all">{formatArchetypeNameWithSuffix(userArch)}</span> 
                        </div>
                      </TableCell>
                      {displayArchetypes.map(oppArch => {
                        const matchupStats = matchupData[userArch.id]?.[oppArch.id];
                        return (
                          <TableCell key={oppArch.id} className="p-0 min-w-[45px]">
                            {renderStatsCell(matchupStats, userArch, oppArch)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="p-0 min-w-[45px] bg-card">
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

