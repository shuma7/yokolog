import type { Archetype, GameClass, ClassIconMapping, ArchetypeWithIcon } from '@/types';
// Ghost and Droplets removed, Moon added for Nightmare
import { Leaf, Swords, Sparkles, Flame, Moon, ShieldCheck, Cog, HelpCircle, Replace } from 'lucide-react'; 
import { v4 as uuidv4 } from 'uuid';

export const CLASS_ICONS: ClassIconMapping = {
  Forestcraft: Leaf,
  Swordcraft: Swords,
  Runecraft: Sparkles,
  Dragoncraft: Flame,
  Nightmare: Moon, // Icon for Nightmare
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
  Nightmare: "ナイトメア", // Japanese name for Nightmare
  Havencraft: "ビショップ",
  Portalcraft: "ネメシス",
};


export const INITIAL_ARCHETYPES: Archetype[] = [
  // 'unknown' archetype - class can be anything, but Forestcraft is a safe default
  { id: 'unknown', name: '不明な相手', abbreviation: '不明', gameClass: 'Forestcraft', isDefault: true }, 
  // エルフ
  { id: uuidv4(), name: 'コントロールエルフ', abbreviation: 'コンエ', gameClass: 'Forestcraft', isDefault: true },
  { id: uuidv4(), name: 'アグロエルフ', abbreviation: 'アグエ', gameClass: 'Forestcraft', isDefault: true },
  // ロイヤル
  { id: uuidv4(), name: '連携ロイヤル', abbreviation: '連携ロ', gameClass: 'Swordcraft', isDefault: true },
  { id: uuidv4(), name: '進化ロイヤル', abbreviation: '進化ロ', gameClass: 'Swordcraft', isDefault: true },
  // ウィッチ
  { id: uuidv4(), name: 'スペルウィッチ', abbreviation: 'スペウィ', gameClass: 'Runecraft', isDefault: true },
  { id: uuidv4(), name: '秘術ウィッチ', abbreviation: '秘術ウィ', gameClass: 'Runecraft', isDefault: true },
  // ドラゴン
  { id: uuidv4(), name: 'ランプドラゴン', abbreviation: 'ランプド', gameClass: 'Dragoncraft', isDefault: true },
  { id: uuidv4(), name: 'バフドラゴン', abbreviation: 'バフド', gameClass: 'Dragoncraft', isDefault: true },
  // ナイトメア (旧ネクロマンサー)
  { id: uuidv4(), name: 'ラストワードナイトメア', abbreviation: 'ラスワNi', gameClass: 'Nightmare', isDefault: true }, // Changed class to Nightmare
  { id: uuidv4(), name: 'ゴーストナイトメア', abbreviation: 'ゴスNi', gameClass: 'Nightmare', isDefault: true }, // Changed class to Nightmare
  // ナイトメア (旧ヴァンパイア)
  { id: uuidv4(), name: '狂乱ナイトメア', abbreviation: '狂乱Ni', gameClass: 'Nightmare', isDefault: true }, // Changed class to Nightmare
  { id: uuidv4(), name: 'ハンドレスナイトメア', abbreviation: 'ハンNi', gameClass: 'Nightmare', isDefault: true }, // Changed class to Nightmare
  // ビショップ
  { id: uuidv4(), name: '回復ビショップ', abbreviation: '回復ビ', gameClass: 'Havencraft', isDefault: true },
  { id: uuidv4(), name: '守護ビショップ', abbreviation: '守護ビ', gameClass: 'Havencraft', isDefault: true },
  // ネメシス
  { id: uuidv4(), name: 'AFネメシス', abbreviation: 'AFネメ', gameClass: 'Portalcraft', isDefault: true },
  { id: uuidv4(), name: '機械ネメシス', abbreviation: '機械ネメ', gameClass: 'Portalcraft', isDefault: true },
];

export const getArchetypeWithIcon = (archetype: Archetype): ArchetypeWithIcon => {
  // Ensure that even if an old class sneaks in, it gets a generic icon
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
