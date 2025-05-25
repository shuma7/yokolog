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

export const ALL_GAME_CLASSES: GameClass[] = [
  "Forestcraft", "Swordcraft", "Runecraft", "Dragoncraft", 
  "Shadowcraft", "Bloodcraft", "Havencraft", "Portalcraft"
];

export interface Archetype {
  id: string; // e.g., uuid
  name: string; // e.g., "Aggro Shadow"
  abbreviation: string; // e.g., "AggroS"
  gameClass: GameClass;
  isDefault?: boolean; // To distinguish pre-defined from user-added
}

export interface MatchData {
  id: string; // e.g., uuid
  timestamp: number; // For sorting, Date.now()
  userArchetypeId: string; // ID of user's archetype
  opponentArchetypeId: string; // ID of opponent's archetype
  turn: "first" | "second" | "unknown";
  result: "win" | "loss" | "draw";
  notes?: string;
  userId: string; // To associate with a username
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
