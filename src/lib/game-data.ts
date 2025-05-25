
import type { Archetype, GameClass, ClassIconMapping, ArchetypeWithIcon, GameClassDetail } from '@/types';
import { Leaf, Swords, Sparkles, Flame, Moon, ShieldCheck, Cog, HelpCircle, Replace } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ALL_GAME_CLASSES } from '@/types'; 

export const CLASS_ICONS: ClassIconMapping = {
  Forestcraft: Leaf,
  Swordcraft: Swords,
  Runecraft: Sparkles,
  Dragoncraft: Flame,
  Nightmare: Moon, 
  Havencraft: ShieldCheck,
  Portalcraft: Cog,
};

export const UNKNOWN_ARCHETYPE_ICON = HelpCircle;
export const GENERIC_ARCHETYPE_ICON = Replace;

export const GAME_CLASS_EN_TO_JP: Record<GameClass, string> = {
  Forestcraft: "エルフ",
  Swordcraft: "ロイヤル",
  Runecraft: "ウィッチ",
  Dragoncraft: "ドラゴン",
  Nightmare: "ナイトメア", 
  Havencraft: "ビショップ",
  Portalcraft: "ネメシス",
};

export const GAME_CLASS_SUFFIX_MAP: Record<GameClass, string> = {
  Forestcraft: "E",
  Swordcraft: "R",
  Runecraft: "W",
  Dragoncraft: "D",
  Nightmare: "Ni",
  Havencraft: "B",
  Portalcraft: "Nm",
};

export const formatArchetypeNameWithSuffix = (archetype: Pick<Archetype, 'id' | 'name' | 'gameClass'>): string => {
  if (!archetype || !archetype.name || !archetype.gameClass) {
    return '不明';
  }

  if (archetype.id === 'unknown') {
    return archetype.name; 
  }

  let cleanName = archetype.name;
  
  Object.values(GAME_CLASS_EN_TO_JP).forEach(jpClass => {
    if (cleanName.includes(jpClass)) {
      cleanName = cleanName.replace(new RegExp(jpClass, 'g'), '').trim();
    }
  });
  
  const suffix = GAME_CLASS_SUFFIX_MAP[archetype.gameClass] || '';
  return `${cleanName}${suffix}`.trim(); 
};


export const INITIAL_ARCHETYPES: Archetype[] = [
  { id: 'unknown', name: '不明な相手', gameClass: 'Forestcraft', isDefault: true },
  // エルフ
  { id: uuidv4(), name: 'コントロール', gameClass: 'Forestcraft', isDefault: true },
  { id: uuidv4(), name: 'アグロ', gameClass: 'Forestcraft', isDefault: true },
  // ロイヤル
  { id: uuidv4(), name: '連携', gameClass: 'Swordcraft', isDefault: true },
  { id: uuidv4(), name: '進化', gameClass: 'Swordcraft', isDefault: true },
  // ウィッチ
  { id: uuidv4(), name: 'スペル', gameClass: 'Runecraft', isDefault: true },
  { id: uuidv4(), name: '秘術', gameClass: 'Runecraft', isDefault: true },
  // ドラゴン
  { id: uuidv4(), name: 'ランプ', gameClass: 'Dragoncraft', isDefault: true },
  { id: uuidv4(), name: 'バフ', gameClass: 'Dragoncraft', isDefault: true },
  // ナイトメア
  { id: uuidv4(), name: 'ラストワード', gameClass: 'Nightmare', isDefault: true },
  { id: uuidv4(), name: 'ゴースト', gameClass: 'Nightmare', isDefault: true },
  { id: uuidv4(), name: '狂乱', gameClass: 'Nightmare', isDefault: true },
  { id: uuidv4(), name: 'ハンドレス', gameClass: 'Nightmare', isDefault: true },
  // ビショップ
  { id: uuidv4(), name: '回復', gameClass: 'Havencraft', isDefault: true },
  { id: uuidv4(), name: '守護', gameClass: 'Havencraft', isDefault: true },
  // ネメシス
  { id: uuidv4(), name: 'AF', gameClass: 'Portalcraft', isDefault: true },
  { id: uuidv4(), name: '機械', gameClass: 'Portalcraft', isDefault: true },
];

export const getArchetypeWithIcon = (archetype: Archetype): ArchetypeWithIcon => {
  const icon = CLASS_ICONS[archetype.gameClass as GameClass] || GENERIC_ARCHETYPE_ICON;
  return {
    ...archetype,
    icon: icon,
  };
};

export const getArchetypesWithIcons = (archetypes: Archetype[]): ArchetypeWithIcon[] => {
  return archetypes.map(getArchetypeWithIcon);
};

export const getIconForClass = (gameClass: GameClass): React.ElementType => {
  return CLASS_ICONS[gameClass] || HelpCircle;
};

export const getJapaneseClassNameFromValue = (gameClassValue: GameClass): string => {
    const classDetail = ALL_GAME_CLASSES.find(gc => gc.value === gameClassValue);
    return classDetail ? classDetail.label : gameClassValue;
};
