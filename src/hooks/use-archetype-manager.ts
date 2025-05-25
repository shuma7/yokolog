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
    // Archetypes being set should ideally be in the correct format by now.
    // Migration is primarily handled by the initial load effect and the ensure-unknown effect.
    setArchetypesInternal(value);
  }, [setArchetypesInternal]);


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
    // Ensure returned archetypes are migrated if somehow old data slipped through.
    return archetypes.map(migrateArchetypeClass).find(arch => arch.id === id);
  };
  
  const deleteArchetype = (id: string) => {
    const isDefaultInitial = migratedInitialArchetypes.some(initialArch => initialArch.id === id && initialArch.isDefault);
    if (isDefaultInitial) return; 

    setArchetypes(prev => prev.filter(arch => arch.id !== id));
  };

  // Ensure 'Unknown Opponent' archetype exists and has a valid class
  useEffect(() => {
    const currentArchetypes = archetypes; // Capture current value for consistent checks within this effect run
    const unknownArchetypeFromStorage = currentArchetypes.find(arch => arch.id === 'unknown');
    let needsUpdate = false;
    let updatedArchetypesWorkingCopy = [...currentArchetypes];

    if (!unknownArchetypeFromStorage) {
      // 'unknown' archetype is missing, add it from template
      const unknownArchetypeTemplate = INITIAL_ARCHETYPES.find(arch => arch.id === 'unknown'); // Use original template
      if (unknownArchetypeTemplate) {
        updatedArchetypesWorkingCopy = [
          migrateArchetypeClass(unknownArchetypeTemplate), // Ensure template is migrated before adding
          ...updatedArchetypesWorkingCopy.filter(a => a.id !== 'unknown')
        ];
        needsUpdate = true;
      }
    } else {
      // 'unknown' archetype exists, check if its class needs migration
      const migratedUnknown = migrateArchetypeClass(unknownArchetypeFromStorage);
      if (migratedUnknown !== unknownArchetypeFromStorage) { // Check if migration actually changed the object reference
        updatedArchetypesWorkingCopy = updatedArchetypesWorkingCopy.map(arch => 
          arch.id === 'unknown' ? migratedUnknown : arch
        );
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      // Only call setArchetypesInternal if a meaningful change occurred
      setArchetypesInternal(updatedArchetypesWorkingCopy);
    }
  // `setArchetypesInternal` is stable from useLocalStorage.
  // The main dependency that will trigger re-evaluation is `archetypes`.
  // This effect needs to run when `archetypes` changes to ensure consistency.
  }, [archetypes, setArchetypesInternal]);

  return { 
    archetypes: archetypes.map(migrateArchetypeClass), 
    addArchetype, 
    getArchetypeById, 
    deleteArchetype, 
    setArchetypes 
  };
}
