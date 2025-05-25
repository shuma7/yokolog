
"use client";

import { useState, useMemo } from 'react';
import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON } from "@/lib/game-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface MatchupTableDisplayProps {
  matches: MatchData[];
  allArchetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

interface MatchupStats {
  wins: number;
  losses: number;
  // draws: number; // Removed draws
  total: number;
  winRate: number;
}

const ALL_USER_ARCHETYPES_VALUE = "all-user-archetypes";
const ALL_OPPONENT_ARCHETYPES_VALUE = "all-opponent-archetypes";

export function MatchupTableDisplay({ matches, allArchetypes, gameClassMapping }: MatchupTableDisplayProps) {
  const [selectedUserArchetypeIds, setSelectedUserArchetypeIds] = useState<string[]>([]);
  const [selectedOpponentArchetypeIds, setSelectedOpponentArchetypeIds] = useState<string[]>([]);

  const sortedArchetypes = useMemo(() => 
    [...allArchetypes].sort((a, b) => {
      if (a.isDefault && a.id === 'unknown') return -1; 
      if (b.isDefault && b.id === 'unknown') return 1;
      const classA = gameClassMapping[a.gameClass] || a.gameClass;
      const classB = gameClassMapping[b.gameClass] || b.gameClass;
      if (classA === classB) return a.name.localeCompare(b.name, 'ja');
      return classA.localeCompare(b.name, 'ja');
    }), [allArchetypes, gameClassMapping]);

  const userArchetypesForFilter = useMemo(() => {
    const ids = new Set(matches.map(m => m.userArchetypeId));
    return sortedArchetypes.filter(a => ids.has(a.id));
  }, [matches, sortedArchetypes]);

  const opponentArchetypesForFilter = useMemo(() => {
    const ids = new Set(matches.map(m => m.opponentArchetypeId));
    return sortedArchetypes.filter(a => ids.has(a.id));
  }, [matches, sortedArchetypes]);


  const filteredMatches = useMemo(() => {
    return matches.filter(match => 
      (selectedUserArchetypeIds.length === 0 || selectedUserArchetypeIds.includes(match.userArchetypeId)) &&
      (selectedOpponentArchetypeIds.length === 0 || selectedOpponentArchetypeIds.includes(match.opponentArchetypeId))
    );
  }, [matches, selectedUserArchetypeIds, selectedOpponentArchetypeIds]);

  const matchupData = useMemo(() => {
    const data: Record<string, Record<string, MatchupStats>> = {};

    filteredMatches.forEach(match => {
      const userArch = allArchetypes.find(a => a.id === match.userArchetypeId);
      const oppArch = allArchetypes.find(a => a.id === match.opponentArchetypeId);

      if (!userArch || !oppArch) return;

      if (!data[userArch.id]) data[userArch.id] = {};
      if (!data[userArch.id][oppArch.id]) {
        data[userArch.id][oppArch.id] = { wins: 0, losses: 0, total: 0, winRate: 0 };
      }

      data[userArch.id][oppArch.id].total++;
      if (match.result === 'win') data[userArch.id][oppArch.id].wins++;
      else if (match.result === 'loss') data[userArch.id][oppArch.id].losses++;
      // No draw counting
    });

    Object.values(data).forEach(oppMap => {
      Object.values(oppMap).forEach(stats => {
        stats.winRate = stats.wins + stats.losses > 0 ? parseFloat(((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)) : 0; 
        if (isNaN(stats.winRate)) stats.winRate = 0;
      });
    });
    return data;
  }, [filteredMatches, allArchetypes]);

  const displayUserArchetypes = selectedUserArchetypeIds.length > 0 
    ? sortedArchetypes.filter(a => selectedUserArchetypeIds.includes(a.id))
    : userArchetypesForFilter;
    
  const displayOpponentArchetypes = selectedOpponentArchetypeIds.length > 0
    ? sortedArchetypes.filter(a => selectedOpponentArchetypeIds.includes(a.id))
    : opponentArchetypesForFilter;

  const renderArchetypeOption = (archetype: Archetype) => {
    const Icon = archetype.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
    return (
      <SelectItem key={archetype.id} value={archetype.id}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{archetype.name} ({archetype.abbreviation})</span>
        </div>
      </SelectItem>
    );
  };
  
  if (matches.length === 0 && allArchetypes.filter(a => !a.isDefault).length === 0) {
    return <p className="text-center text-muted-foreground py-8">対戦データがありません。まずは対戦記録とデッキタイプを登録しましょう。</p>;
  }
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">対戦データがありません。対戦を記録してください。</p>;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>デッキタイプ相性表</CardTitle>
        <CardDescription>記録されたゲームに基づくデッキタイプ間の勝率です。デッキタイプを選択して表を絞り込みます。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Select 
              onValueChange={(value) => setSelectedUserArchetypeIds(value === ALL_USER_ARCHETYPES_VALUE ? [] : (value ? [value] : []))}
              value={selectedUserArchetypeIds.length > 0 ? selectedUserArchetypeIds[0] : ALL_USER_ARCHETYPES_VALUE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="自分のデッキタイプで絞り込み (全て)" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-72">
                  <SelectItem value={ALL_USER_ARCHETYPES_VALUE}>全ての自分のデッキタイプ</SelectItem>
                  {userArchetypesForFilter.map(renderArchetypeOption)}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              onValueChange={(value) => setSelectedOpponentArchetypeIds(value === ALL_OPPONENT_ARCHETYPES_VALUE ? [] : (value ? [value] : []))}
              value={selectedOpponentArchetypeIds.length > 0 ? selectedOpponentArchetypeIds[0] : ALL_OPPONENT_ARCHETYPES_VALUE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="相手のデッキタイプで絞り込み (全て)" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-72">
                  <SelectItem value={ALL_OPPONENT_ARCHETYPES_VALUE}>全ての相手デッキタイプ</SelectItem>
                  {opponentArchetypesForFilter.map(renderArchetypeOption)}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
        </div>

        {Object.keys(matchupData).length === 0 && filteredMatches.length > 0 && (
           <p className="text-center text-muted-foreground py-4">現在のフィルター条件に一致する記録済みの対戦データがありません。</p>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">自分のデッキタイプ</TableHead>
                {displayOpponentArchetypes.map(oppArch => {
                  const OppIcon = oppArch.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[oppArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                  return (
                    <TableHead key={oppArch.id} className="text-center min-w-[150px]">
                      <div className="flex flex-col items-center">
                        <OppIcon className="h-5 w-5 mb-1" />
                        {oppArch.name}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUserArchetypes.map(userArch => {
                if (!matchupData[userArch.id] && selectedUserArchetypeIds.length > 0 && Object.keys(matchupData).length > 0) return null; 
                const UserIcon = userArch.id === 'unknown' ? UNKNOWN_ARCHETYPE_ICON : CLASS_ICONS[userArch.gameClass] || GENERIC_ARCHETYPE_ICON;
                return (
                  <TableRow key={userArch.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">
                       <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {userArch.name}
                       </div>
                    </TableCell>
                    {displayOpponentArchetypes.map(oppArch => {
                      const stats = matchupData[userArch.id]?.[oppArch.id];
                      return (
                        <TableCell key={oppArch.id} className="text-center">
                          {stats ? (
                            <div className="flex flex-col items-center">
                              <Badge 
                                variant={stats.winRate > 55 ? 'default' : stats.winRate < 45 && stats.winRate > 0 ? 'destructive' : 'secondary'}
                                className={`text-lg font-semibold tabular-nums ${
                                  stats.winRate > 55 ? 'bg-green-600 hover:bg-green-700' : 
                                  stats.winRate < 45 && stats.winRate > 0 ? 'bg-red-600 hover:bg-red-700' : 
                                  stats.winRate === 0 && (stats.wins + stats.losses > 0) ? 'bg-red-700 hover:bg-red-800' : ''
                                }`}
                              >
                                {stats.winRate}%
                              </Badge>
                              <span className="text-xs text-muted-foreground tabular-nums">({stats.wins}-{stats.losses})</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
               {displayUserArchetypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={displayOpponentArchetypes.length + 1} className="text-center text-muted-foreground py-4">
                    表示できる自分のデッキタイプがありません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
           {displayUserArchetypes.length > 0 && displayOpponentArchetypes.length === 0 && (
             <p className="text-center text-muted-foreground py-4">表示できる相手のデッキタイプがありません。</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
