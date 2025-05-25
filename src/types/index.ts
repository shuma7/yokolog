import type { LucideIcon } from 'lucide-react';

export type GameClass = 
  | "Forestcraft" 
  | "Swordcraft" 
  | "Runecraft" 
  | "Dragoncraft" 
  | "Shadowcraft" 
  | "Bloodcraft" 
  | "Havencraft" 
  | "Portalcraft";

export interface GameClassDetail {
  value: GameClass;
  label: string;
}

// This array is used for select options and needs Japanese labels.
// The `value` must be the English GameClass literal for consistency in data storage.
export const ALL_GAME_CLASSES: GameClassDetail[] = [
  { value: "Forestcraft", label: "エルフ" },
  { value: "Swordcraft", label: "ロイヤル" },
  { value: "Runecraft", label: "ウィッチ" },
  { value: "Dragoncraft", label: "ドラゴン" },
  { value: "Shadowcraft", label: "ネクロマンサー" },
  { value: "Bloodcraft", label: "ヴァンパイア" },
  { value: "Havencraft", label: "ビショップ" },
  { value: "Portalcraft", label: "ネメシス" },
];

export interface Archetype {
  id: string; 
  name: string; 
  abbreviation: string; 
  gameClass: GameClass; // Stores the English literal, e.g., "Forestcraft"
  isDefault?: boolean; 
}

export interface MatchData {
  id: string; 
  timestamp: number; 
  userArchetypeId: string; 
  opponentArchetypeId: string; 
  turn: "first" | "second" | "unknown";
  result: "win" | "loss" | "draw";
  notes?: string;
  userId: string; 
}

export interface ArchetypeWithIcon extends Archetype {
  icon: LucideIcon;
}

export interface ClassIconMapping {
  Forestcraft: LucideIcon;
  Swordcraft: LucideIcon;
  Runecraft: LucideIcon;
  Dragoncraft: LucideIcon;
  Shadowcraft: LucideIcon;
  Bloodcraft: LucideIcon;
  Havencraft: LucideIcon;
  Portalcraft: LucideIcon;
}

// Helper type for mapping GameClass English literals to Japanese names
export type GameClassNameMap = Record<GameClass, string>;
