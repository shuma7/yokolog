import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { Archetype, GameClass } from '@/types';
import { INITIAL_ARCHETYPES } from '@/lib/game-data';
import { useEffect } from 'react';

const ARCHETYPES_KEY = 'yokolog_archetypes';

// Helper function to migrate old class names to Nightmare
const migrateArchetypeClass = (archetype: Archetype): Archetype => {
  if ((archetype.gameClass as string) === 'Shadowcraft' || (archetype.gameClass as string) === 'Bloodcraft') {
    return { ...archetype, gameClass: 'Nightmare' };
  }
  return archetype;
};

const migratedInitialArchetypes = INITIAL_ARCHETYPES.map(migrateArchetypeClass);

export function useArchetypeManager() {
  const [archetypes, setArchetypesInternal] = useLocalStorage<Archetype[]>(ARCHETYPES_KEY, migratedInitialArchetypes);

  // Data migration effect for existing users
  useEffect(() => {
    let hasChanges = false;
    const migrated = archetypes.map(arch => {
      if ((arch.gameClass as string) === 'Shadowcraft' || (arch.gameClass as string) === 'Bloodcraft') {
        hasChanges = true;
        return { ...arch, gameClass: 'Nightmare' as GameClass };
      }
      return arch;
    });

    if (hasChanges) {
      setArchetypesInternal(migrated);
    }
  }, []); // Empty dependency array: run once on mount after initial load from localStorage

  const setArchetypes = (value: Archetype[] | ((val: Archetype[]) => Archetype[])) => {
    if (typeof value === 'function') {
      setArchetypesInternal(prev => value(prev.map(migrateArchetypeClass)).map(migrateArchetypeClass));
    } else {
      setArchetypesInternal(value.map(migrateArchetypeClass));
    }
  };


  const addArchetype = (name: string, abbreviation: string, gameClass: GameClass) => {
    const newArchetype: Archetype = {
      id: uuidv4(),
      name,
      abbreviation,
      gameClass, // gameClass should already be one of the new valid types
      isDefault: false,
    };
    setArchetypes(prev => [...prev, newArchetype]);
    return newArchetype;
  };

  const getArchetypeById = (id: string): Archetype | undefined => {
    return archetypes.map(migrateArchetypeClass).find(arch => arch.id === id);
  };
  
  const deleteArchetype = (id: string) => {
    // Prevent deleting default archetypes by checking against migrated initial archetypes
    const isDefaultInitial = migratedInitialArchetypes.some(initialArch => initialArch.id === id && initialArch.isDefault);
    if (isDefaultInitial) return; 

    setArchetypes(prev => prev.filter(arch => arch.id !== id));
  };

  // Ensure 'Unknown Opponent' archetype exists and has a valid class
  useEffect(() => {
    const unknownArchExists = archetypes.some(arch => arch.id === 'unknown');
    if (!unknownArchExists) {
      const unknownArchetypeTemplate = INITIAL_ARCHETYPES.find(arch => arch.id === 'unknown');
      if (unknownArchetypeTemplate) {
        setArchetypes(prev => [migrateArchetypeClass(unknownArchetypeTemplate), ...prev.filter(a => a.id !== 'unknown')]);
      }
    } else {
      // Ensure existing unknown archetype has its class migrated if it was an old one
      setArchetypes(prev => prev.map(arch => {
        if (arch.id === 'unknown') {
          return migrateArchetypeClass(arch);
        }
        return arch;
      }));
    }
  }, [archetypes, setArchetypes]); // Re-run if archetypes array itself changes reference

  return { 
    archetypes: archetypes.map(migrateArchetypeClass), // Always return migrated archetypes
    addArchetype, 
    getArchetypeById, 
    deleteArchetype, 
    setArchetypes 
  };
}
