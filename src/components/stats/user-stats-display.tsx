"use client";

import type { MatchData, Archetype, GameClass } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON } from "@/lib/game-data";

interface UserStatsDisplayProps {
  matches: MatchData[];
  archetypes: Archetype[];
}

interface StatItem {
  label: string;
  value: string | number;
  percentage?: number;
  icon?: React.ReactNode;
}

function calculateWinRate(wins: number, totalGames: number): number {
  return totalGames > 0 ? parseFloat(((wins / totalGames) * 100).toFixed(1)) : 0;
}

export function UserStatsDisplay({ matches, archetypes }: UserStatsDisplayProps) {
  if (matches.length === 0) {
    return null; // Don't show stats if no matches
  }

  const totalGames = matches.length;
  const totalWins = matches.filter(m => m.result === 'win').length;
  const totalLosses = matches.filter(m => m.result === 'loss').length;
  const totalDraws = matches.filter(m => m.result === 'draw').length;
  const overallWinRate = calculateWinRate(totalWins, totalGames);

  const firstTurnGames = matches.filter(m => m.turn === 'first').length;
  const firstTurnWins = matches.filter(m => m.turn === 'first' && m.result === 'win').length;
  const firstTurnWinRate = calculateWinRate(firstTurnWins, firstTurnGames);

  const secondTurnGames = matches.filter(m => m.turn === 'second').length;
  const secondTurnWins = matches.filter(m => m.turn === 'second' && m.result === 'win').length;
  const secondTurnWinRate = calculateWinRate(secondTurnWins, secondTurnGames);

  const statsByArchetype: StatItem[] = archetypes
    .map(arch => {
      const gamesWithArchetype = matches.filter(m => m.userArchetypeId === arch.id);
      if (gamesWithArchetype.length === 0) return null;
      const winsWithArchetype = gamesWithArchetype.filter(m => m.result === 'win').length;
      const Icon = CLASS_ICONS[arch.gameClass] || GENERIC_ARCHETYPE_ICON;
      return {
        label: arch.name,
        value: `${calculateWinRate(winsWithArchetype, gamesWithArchetype.length)}% WR (${winsWithArchetype}/${gamesWithArchetype.length})`,
        percentage: calculateWinRate(winsWithArchetype, gamesWithArchetype.length),
        icon: <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
      };
    })
    .filter(Boolean) as StatItem[];

  const statsByClass: StatItem[] = Object.keys(CLASS_ICONS).map(gc => {
    const gameClass = gc as GameClass;
    const archetypesInClass = archetypes.filter(a => a.gameClass === gameClass);
    const gamesWithClass = matches.filter(m => {
      const userArch = archetypes.find(a => a.id === m.userArchetypeId);
      return userArch && userArch.gameClass === gameClass;
    });
    if (gamesWithClass.length === 0) return null;
    const winsWithClass = gamesWithClass.filter(m => m.result === 'win').length;
    const Icon = CLASS_ICONS[gameClass] || GENERIC_ARCHETYPE_ICON;
     return {
        label: gameClass,
        value: `${calculateWinRate(winsWithClass, gamesWithClass.length)}% WR (${winsWithClass}/${gamesWithClass.length})`,
        percentage: calculateWinRate(winsWithClass, gamesWithClass.length),
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
          <CardTitle className="text-2xl">Overall Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{totalGames}</p>
            <p className="text-sm text-muted-foreground">Total Games</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-500">{totalWins}</p>
            <p className="text-sm text-muted-foreground">Wins</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-500">{totalLosses}</p>
            <p className="text-sm text-muted-foreground">Losses</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{overallWinRate}%</p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard title="Win Rate by Turn Order" items={[
          { label: "Going First", value: `${firstTurnWinRate}% WR (${firstTurnWins}/${firstTurnGames})`, percentage: firstTurnWinRate },
          { label: "Going Second", value: `${secondTurnWinRate}% WR (${secondTurnWins}/${secondTurnGames})`, percentage: secondTurnWinRate },
        ]} />

        <Tabs defaultValue="archetype" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="archetype">By Archetype</TabsTrigger>
            <TabsTrigger value="class">By Class</TabsTrigger>
          </TabsList>
          <TabsContent value="archetype">
             <StatCard title="Win Rate by Your Archetype" items={statsByArchetype.sort((a,b) => (b.percentage || 0) - (a.percentage || 0) )} />
          </TabsContent>
          <TabsContent value="class">
             <StatCard title="Win Rate by Your Class" items={statsByClass.sort((a,b) => (b.percentage || 0) - (a.percentage || 0))} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
