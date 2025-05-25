import type { Archetype, GameClass, ClassIconMapping, ArchetypeWithIcon } from '@/types';
import { Leaf, Swords, Sparkles, Flame, Ghost, Droplets, ShieldCheck, Cog, HelpCircle, Replace } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

export const CLASS_ICONS: ClassIconMapping = {
  Forestcraft: Leaf,
  Swordcraft: Swords,
  Runecraft: Sparkles,
  Dragoncraft: Flame,
  Shadowcraft: Ghost,
  Bloodcraft: Droplets,
  Havencraft: ShieldCheck,
  Portalcraft: Cog,
};

export const UNKNOWN_ARCHETYPE_ICON = HelpCircle;
export const GENERIC_ARCHETYPE_ICON = Replace;


export const INITIAL_ARCHETYPES: Archetype[] = [
  // General placeholder for unknown opponent
  { id: 'unknown', name: 'Unknown Opponent', abbreviation: 'Unk', gameClass: 'Forestcraft', isDefault: true }, // gameClass is arbitrary here
  // Add a few examples per class
  // Forestcraft
  { id: uuidv4(), name: 'Control Forest', abbreviation: 'CtrlF', gameClass: 'Forestcraft', isDefault: true },
  { id: uuidv4(), name: 'Aggro Forest', abbreviation: 'AgroF', gameClass: 'Forestcraft', isDefault: true },
  // Swordcraft
  { id: uuidv4(), name: 'Rally Sword', abbreviation: 'RalS', gameClass: 'Swordcraft', isDefault: true },
  { id: uuidv4(), name: 'Evo Sword', abbreviation: 'EvoS', gameClass: 'Swordcraft', isDefault: true },
  // Runecraft
  { id: uuidv4(), name: 'Spellboost Rune', abbreviation: 'SpbR', gameClass: 'Runecraft', isDefault: true },
  { id: uuidv4(), name: 'Dirt Rune', abbreviation: 'DirtR', gameClass: 'Runecraft', isDefault: true },
  // Dragoncraft
  { id: uuidv4(), name: 'Ramp Dragon', abbreviation: 'RampD', gameClass: 'Dragoncraft', isDefault: true },
  { id: uuidv4(), name: 'Buff Dragon', abbreviation: 'BuffD', gameClass: 'Dragoncraft', isDefault: true },
  // Shadowcraft
  { id: uuidv4(), name: 'Last Words Shadow', abbreviation: 'LWS', gameClass: 'Shadowcraft', isDefault: true },
  { id: uuidv4(), name: 'Ghost Shadow', abbreviation: 'GhstS', gameClass: 'Shadowcraft', isDefault: true },
  // Bloodcraft
  { id: uuidv4(), name: 'Wrath Blood', abbreviation: 'WrthB', gameClass: 'Bloodcraft', isDefault: true },
  { id: uuidv4(), name: 'Handless Blood', abbreviation: 'HndlB', gameClass: 'Bloodcraft', isDefault: true },
  // Havencraft
  { id: uuidv4(), name: 'Heal Haven', abbreviation: 'HealH', gameClass: 'Havencraft', isDefault: true },
  { id: uuidv4(), name: 'Ward Haven', abbreviation: 'WardH', gameClass: 'Havencraft', isDefault: true },
  // Portalcraft
  { id: uuidv4(), name: 'Artifact Portal', abbreviation: 'ArtiP', gameClass: 'Portalcraft', isDefault: true },
  { id: uuidv4(), name: 'Machina Portal', abbreviation: 'MachP', gameClass: 'Portalcraft', isDefault: true },
];

export const getArchetypeWithIcon = (archetype: Archetype): ArchetypeWithIcon => {
  return {
    ...archetype,
    icon: CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON,
  };
};

export const getArchetypesWithIcons = (archetypes: Archetype[]): ArchetypeWithIcon[] => {
  return archetypes.map(getArchetypeWithIcon);
};

export const getIconForClass = (gameClass: GameClass): React.ElementType => {
  return CLASS_ICONS[gameClass] || HelpCircle;
};
