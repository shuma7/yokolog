
"use client";

import type { Season } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: string | null;
  onSelectSeason: (seasonId: string | null) => void;
  formatDate: (timestamp: number) => string; // To format season start/end dates if needed
}

export function SeasonSelector({ seasons, selectedSeasonId, onSelectSeason, formatDate }: SeasonSelectorProps) {
  const activeSeason = seasons.find(s => s.endDate === null);
  const pastSeasons = seasons.filter(s => s.endDate !== null).sort((a,b) => b.startDate - a.startDate); // Newest past first

  return (
    <Select
      value={selectedSeasonId || ""}
      onValueChange={(value) => onSelectSeason(value === "null-option" ? null : value)}
    >
      <SelectTrigger className="w-full md:w-[320px]">
        <SelectValue placeholder="シーズンを選択..." />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-auto max-h-72">
          {seasons.length === 0 && <SelectItem value="no-seasons" disabled>利用可能なシーズンがありません</SelectItem>}
          
          {activeSeason && (
            <SelectItem key={activeSeason.id} value={activeSeason.id}>
              {activeSeason.name} (現在のシーズン)
            </SelectItem>
          )}
          {pastSeasons.map((season) => (
            <SelectItem key={season.id} value={season.id}>
              {season.name} ({formatDate(season.startDate)} ~ {season.endDate ? formatDate(season.endDate) : '現在'})
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
