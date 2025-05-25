
import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { Archetype, GameClass } from '@/types';
import { INITIAL_ARCHETYPES } from '@/lib/game-data';
import { useEffect, useCallback } from 'react';

const ARCHETYPES_KEY = 'yokolog_archetypes';

// Helper function to migrate old class names to Nightmare
const migrateArchetypeClass = (archetype: Archetype): Archetype => {
  if ((archetype.gameClass as string) === 'Shadowcraft' || (archetype.gameClass as string) === 'Bloodcraft') {
    return { ...archetype, gameClass: 'Nightmare' as GameClass };
  }
  return archetype;
};

const migratedInitialArchetypes = INITIAL_ARCHETYPES.map(migrateArchetypeClass);

export function useArchetypeManager() {
  const [archetypes, setArchetypesInternal] = useLocalStorage<Archetype[]>(ARCHETYPES_KEY, migratedInitialArchetypes);

  // Data migration effect for existing users - run once on mount
  useEffect(() => {
    let hasChanges = false;
    const migrated = archetypes.map(arch => {
      const originalClass = arch.gameClass as string;
      if (originalClass === 'Shadowcraft' || originalClass === 'Bloodcraft') {
        hasChanges = true;
        return { ...arch, gameClass: 'Nightmare' as GameClass };
      }
      return arch;
    });

    if (hasChanges) {
      setArchetypesInternal(migrated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This effect should run only once after initial load. archetypes at this point is the initially loaded value.

  const setArchetypes = useCallback((value: Archetype[] | ((val: Archetype[]) => Archetype[])) => {
    setArchetypesInternal(value);
  }, [setArchetypesInternal]);


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

  const updateArchetype = (updatedArchetype: Archetype) => {
    if (updatedArchetype.isDefault) {
        // Optionally, prevent full updates to default archetypes
        // For now, we allow it but the UI might restrict it further
        console.warn("Attempting to update a default archetype. This might be restricted by UI.");
    }
    setArchetypes(prev =>
      prev.map(arch => (arch.id === updatedArchetype.id ? { ...arch, ...updatedArchetype } : arch))
    );
    return updatedArchetype;
  };


  const getArchetypeById = (id: string): Archetype | undefined => {
    return archetypes.map(migrateArchetypeClass).find(arch => arch.id === id);
  };
  
  const deleteArchetype = (id: string) => {
    const archetypeToDelete = archetypes.find(arch => arch.id === id);
    if (archetypeToDelete && archetypeToDelete.isDefault) {
        // Prevent deletion of default archetypes.
        // The UI in ManageArchetypesPage should already prevent triggering this for default archetypes.
        console.warn(`Attempted to delete default archetype "${archetypeToDelete.name}". Operation aborted.`);
        throw new Error("デフォルトのデッキタイプは削除できません。");
    }
    setArchetypes(prev => prev.filter(arch => arch.id !== id));
  };

  // Ensure 'Unknown Opponent' archetype exists and has a valid class
  useEffect(() => {
    const currentArchetypesSnapshot = archetypes; 
    let updatedArchetypesWorkingCopy = [...currentArchetypesSnapshot];
    let needsUpdate = false;

    const unknownArchetypeFromStorage = updatedArchetypesWorkingCopy.find(arch => arch.id === 'unknown');
    
    if (!unknownArchetypeFromStorage) {
      const unknownArchetypeTemplate = INITIAL_ARCHETYPES.find(arch => arch.id === 'unknown');
      if (unknownArchetypeTemplate) {
        // Add missing 'unknown' archetype, ensuring it's migrated
        updatedArchetypesWorkingCopy = [migrateArchetypeClass(unknownArchetypeTemplate), ...updatedArchetypesWorkingCopy.filter(a => a.id !== 'unknown')];
        needsUpdate = true;
      }
    } else {
      // 'unknown' archetype exists, ensure it's migrated
      const migratedUnknown = migrateArchetypeClass(unknownArchetypeFromStorage);
      if (migratedUnknown.gameClass !== unknownArchetypeFromStorage.gameClass) { // Check if migration occurred
        updatedArchetypesWorkingCopy = updatedArchetypesWorkingCopy.map(arch =>
          arch.id === 'unknown' ? migratedUnknown : arch
        );
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setArchetypesInternal(updatedArchetypesWorkingCopy);
    }
  }, [archetypes, setArchetypesInternal]);

  return { 
    archetypes: archetypes.map(migrateArchetypeClass), 
    addArchetype, 
    updateArchetype,
    getArchetypeById, 
    deleteArchetype, 
    setArchetypes 
  };
}

    