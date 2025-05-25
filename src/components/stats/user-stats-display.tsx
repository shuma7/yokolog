"use client";

import type { MatchData, Archetype, GameClass, GameClassNameMap } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON } from "@/lib/game-data";

interface UserStatsDisplayProps {
  matches: MatchData[];
  archetypes: Archetype[];
  gameClassMapping: GameClassNameMap;
}

interface StatItem {
  label: string;
  value: string | number;
  percentage?: number;
  icon?: React.ReactNode;
}

function calculateWinRate(wins: number, gamesPlayed: number): number {
  // Calculate win rate based on wins and (wins + losses), draws are excluded from this specific calculation.
  return gamesPlayed > 0 ? parseFloat(((wins / gamesPlayed) * 100).toFixed(1)) : 0;
}

export function UserStatsDisplay({ matches, archetypes, gameClassMapping }: UserStatsDisplayProps) {
  if (matches.length === 0) {
    return null; 
  }

  const totalGames = matches.length;
  const totalWins = matches.filter(m => m.result === 'win').length;
  const totalLosses = matches.filter(m => m.result === 'loss').length;
  // const totalDraws = matches.filter(m => m.result === 'draw').length; // Not used in overall WR display
  const gamesForWinRate = totalWins + totalLosses; // Denominator for win rate
  const overallWinRate = calculateWinRate(totalWins, gamesForWinRate);

  const firstTurnMatches = matches.filter(m => m.turn === 'first');
  const firstTurnGamesPlayed = firstTurnMatches.filter(m => m.result === 'win' || m.result === 'loss').length;
  const firstTurnWins = firstTurnMatches.filter(m => m.result === 'win').length;
  const firstTurnWinRate = calculateWinRate(firstTurnWins, firstTurnGamesPlayed);

  const secondTurnMatches = matches.filter(m => m.turn === 'second');
  const secondTurnGamesPlayed = secondTurnMatches.filter(m => m.result === 'win' || m.result === 'loss').length;
  const secondTurnWins = secondTurnMatches.filter(m => m.result === 'win').length;
  const secondTurnWinRate = calculateWinRate(secondTurnWins, secondTurnGamesPlayed);

  const statsByArchetype: StatItem[] = archetypes
    .map(arch => {
      const gamesWithArchetype = matches.filter(m => m.userArchetypeId === arch.id);
      if (gamesWithArchetype.length === 0) return null;
      const winsWithArchetype = gamesWithArchetype.filter(m => m.result === 'win').length;
      const lossesWithArchetype = gamesWithArchetype.filter(m => m.result === 'loss').length;
      const gamesPlayedForWR = winsWithArchetype + lossesWithArchetype;
      const wr = calculateWinRate(winsWithArchetype, gamesPlayedForWR);
      const Icon = CLASS_ICONS[arch.gameClass] || GENERIC_ARCHETYPE_ICON;
      return {
        label: arch.name,
        value: `${wr}% WR (${winsWithArchetype}/${gamesPlayedForWR}) (${gamesWithArchetype.length}戦)`,
        percentage: wr,
        icon: <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
      };
    })
    .filter(Boolean) as StatItem[];

  const statsByClass: StatItem[] = (Object.keys(CLASS_ICONS) as GameClass[]).map(gc => {
    const gameClassKey = gc as GameClass;
    const archetypesInClass = archetypes.filter(a => a.gameClass === gameClassKey);
    const gamesWithClass = matches.filter(m => {
      const userArch = archetypes.find(a => a.id === m.userArchetypeId);
      return userArch && userArch.gameClass === gameClassKey;
    });
    if (gamesWithClass.length === 0) return null;
    const winsWithClass = gamesWithClass.filter(m => m.result === 'win').length;
    const lossesWithClass = gamesWithClass.filter(m => m.result === 'loss').length;
    const gamesPlayedForWR = winsWithClass + lossesWithClass;
    const wr = calculateWinRate(winsWithClass, gamesPlayedForWR);

    const Icon = CLASS_ICONS[gameClassKey] || GENERIC_ARCHETYPE_ICON;
    const displayClassName = gameClassMapping[gameClassKey] || gameClassKey;
     return {
        label: displayClassName,
        value: `${wr}% WR (${winsWithClass}/${gamesPlayedForWR}) (${gamesWithClass.length}戦)`,
        percentage: wr,
        icon: <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
      };
  }).filter(Boolean) as StatItem[];


  const StatCard = ({ title, items, showProgress = true }: { title: string, items: StatItem[], showProgress?: boolean }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="flex items-center font-medium text-muted-foreground">
                {item.icon}
                {item.label}
              </span>
              <span className="font-semibold">{item.value}</span>
            </div>
            {showProgress && typeof item.percentage === 'number' && (
              <Progress value={item.percentage} className="h-2" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 my-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">全体成績</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{totalGames}</p>
            <p className="text-sm text-muted-foreground">総対戦数</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-500">{totalWins}</p>
            <p className="text-sm text-muted-foreground">勝利数</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-500">{totalLosses}</p>
            <p className="text-sm text-muted-foreground">敗北数</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{overallWinRate}%</p>
            <p className="text-sm text-muted-foreground">勝率</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard title="先攻/後攻別 勝率" items={[
          { label: "先攻", value: `${firstTurnWinRate}% WR (${firstTurnWins}/${firstTurnGamesPlayed}) (${firstTurnMatches.length}戦)`, percentage: firstTurnWinRate },
          { label: "後攻", value: `${secondTurnWinRate}% WR (${secondTurnWins}/${secondTurnGamesPlayed}) (${secondTurnMatches.length}戦)`, percentage: secondTurnWinRate },
        ]} />

        <Tabs defaultValue="archetype" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="archetype">デッキタイプ別</TabsTrigger>
            <TabsTrigger value="class">クラス別</TabsTrigger>
          </TabsList>
          <TabsContent value="archetype">
             <StatCard title="自分のデッキタイプ別 勝率" items={statsByArchetype.sort((a,b) => (b.percentage || 0) - (a.percentage || 0) )} />
          </TabsContent>
          <TabsContent value="class">
             <StatCard title="自分のクラス別 勝率" items={statsByClass.sort((a,b) => (b.percentage || 0) - (a.percentage || 0))} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
