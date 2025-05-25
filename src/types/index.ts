
import type { LucideIcon } from 'lucide-react';

export type GameClass = 
  | "Forestcraft" 
  | "Swordcraft" 
  | "Runecraft" 
  | "Dragoncraft" 
  | "Nightmare"
  | "Havencraft" 
  | "Portalcraft";

export interface GameClassDetail {
  value: GameClass;
  label: string;
}

export const ALL_GAME_CLASSES: GameClassDetail[] = [
  { value: "Forestcraft", label: "エルフ" },
  { value: "Swordcraft", label: "ロイヤル" },
  { value: "Runecraft", label: "ウィッチ" },
  { value: "Dragoncraft", label: "ドラゴン" },
  { value: "Nightmare", label: "ナイトメア" },
  { value: "Havencraft", label: "ビショップ" },
  { value: "Portalcraft", label: "ネメシス" },
];

export interface Archetype {
  id: string; 
  name: string; 
  abbreviation: string; 
  gameClass: GameClass;
  isDefault?: boolean; 
}

export interface MatchData {
  id: string; 
  timestamp: number; 
  userArchetypeId: string; 
  opponentArchetypeId: string; 
  turn: "first" | "second" | "unknown";
  result: "win" | "loss";
  notes?: string;
  userId: string; // Added userId, it's now required
}

export interface ArchetypeWithIcon extends Archetype {
  icon: LucideIcon;
}

export interface ClassIconMapping {
  Forestcraft: LucideIcon;
  Swordcraft: LucideIcon;
  Runecraft: LucideIcon;
  Dragoncraft: LucideIcon;
  Nightmare: LucideIcon;
  Havencraft: LucideIcon;
  Portalcraft: LucideIcon;
}

export type GameClassNameMap = Record<GameClass, string>;
