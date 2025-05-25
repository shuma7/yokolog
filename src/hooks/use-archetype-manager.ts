"use client";

import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { Archetype, GameClass } from '@/types';
import { INITIAL_ARCHETYPES } from '@/lib/game-data';

const ARCHETYPES_KEY = 'yokolog_archetypes';

export function useArchetypeManager() {
  const [archetypes, setArchetypes] = useLocalStorage<Archetype[]>(ARCHETYPES_KEY, INITIAL_ARCHETYPES);

  const addArchetype = (name: string, abbreviation: string, gameClass: GameClass) => {
    const newArchetype: Archetype = {
      id: uuidv4(),
      name,
      abbreviation,
      gameClass,
      isDefault: false,
    };
    setArchetypes(prev => [...prev, newArchetype]);
    return newArchetype;
  };

  const getArchetypeById = (id: string): Archetype | undefined => {
    return archetypes.find(arch => arch.id === id);
  };
  
  const deleteArchetype = (id: string) => {
    setArchetypes(prev => prev.filter(arch => arch.id !== id && !arch.isDefault)); // Prevent deleting default archetypes
  };

  // Ensure 'Unknown Opponent' archetype exists
  useEffect(() => {
    if (!archetypes.find(arch => arch.id === 'unknown')) {
      const unknownArchetype = INITIAL_ARCHETYPES.find(arch => arch.id === 'unknown');
      if (unknownArchetype) {
        setArchetypes(prev => [unknownArchetype, ...prev.filter(a => a.id !== 'unknown')]);
      }
    }
  }, [archetypes, setArchetypes]);


  return { archetypes, addArchetype, getArchetypeById, deleteArchetype, setArchetypes };
}
