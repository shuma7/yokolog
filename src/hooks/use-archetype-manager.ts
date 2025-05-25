
import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { Archetype, GameClass } from '@/types';
import { INITIAL_ARCHETYPES, GAME_CLASS_EN_TO_JP, GAME_CLASS_SUFFIX_MAP } from '@/lib/game-data';
import { useEffect, useCallback } from 'react';

const ARCHETYPES_KEY = 'yokolog_archetypes';

// Helper function to migrate old class names to Nightmare
const migrateArchetypeClass = (archetype: Archetype): Archetype => {
  if ((archetype.gameClass as string) === 'Shadowcraft' || (archetype.gameClass as string) === 'Bloodcraft') {
    return { ...archetype, gameClass: 'Nightmare' as GameClass };
  }
  return archetype;
};

const migratedInitialArchetypes = INITIAL_ARCHETYPES.map(archetype => {
    let migratedArch = migrateArchetypeClass(archetype);
    // Further clean initial names here if needed, though primary cleaning for initial data is in lib/game-data.ts
    return migratedArch;
});

export function useArchetypeManager() {
  const [archetypes, setArchetypesInternal] = useLocalStorage<Archetype[]>(ARCHETYPES_KEY, migratedInitialArchetypes);

  // Data migration effect for class names (Shadowcraft/Bloodcraft to Nightmare)
  useEffect(() => {
    let hasClassChanges = false;
    const migratedClassArchetypes = archetypes.map(arch => {
      const originalClass = arch.gameClass as string;
      if (originalClass === 'Shadowcraft' || originalClass === 'Bloodcraft') {
        hasClassChanges = true;
        return { ...arch, gameClass: 'Nightmare' as GameClass };
      }
      return arch;
    });

    if (hasClassChanges) {
      setArchetypesInternal(migratedClassArchetypes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once based on initial archetypes loaded

  // Data migration/cleaning effect for archetype names
  useEffect(() => {
    let hasNameChanges = false;
    const japaneseClassNamesToRemove = Object.values(GAME_CLASS_EN_TO_JP);
    const oldJapaneseClassNames = ["ネクロマンサー", "ヴァンパイア"];
    const allNamesToRemoveSet = new Set([...japaneseClassNamesToRemove, ...oldJapaneseClassNames]);
    const classSuffixesToRemove = Object.values(GAME_CLASS_SUFFIX_MAP);


    const cleanedNameArchetypes = archetypes.map(arch => {
      if (arch.id === 'unknown') return arch; // Do not clean the name of 'unknown' archetype

      let newName = arch.name;
      let nameWasChangedInThisIteration = false;

      allNamesToRemoveSet.forEach(jpClassName => {
        if (newName.includes(jpClassName)) {
          newName = newName.replace(new RegExp(jpClassName, 'g'), '').trim();
          nameWasChangedInThisIteration = true;
        }
      });
      
      classSuffixesToRemove.forEach(suffix => {
        if (newName.endsWith(suffix)) {
          newName = newName.slice(0, -suffix.length).trim();
          nameWasChangedInThisIteration = true;
        }
      });

      newName = newName.replace(/\s\s+/g, ' ').trim(); 

      if (nameWasChangedInThisIteration) {
        hasNameChanges = true;
        return { ...arch, name: newName === "" ? "（名称不明）" : newName };
      }
      return arch;
    });

    if (hasNameChanges) {
      setArchetypesInternal(cleanedNameArchetypes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetypes]); // Re-run if archetypes themselves change


  // Ensure 'Unknown Opponent' archetype exists and is correctly migrated/set up
 useEffect(() => {
    let currentArchetypesSnapshot = archetypes; 
    let updatedArchetypesWorkingCopy = [...currentArchetypesSnapshot];
    let needsUpdate = false;

    const unknownArchetypeFromStorage = updatedArchetypesWorkingCopy.find(arch => arch.id === 'unknown');
    const unknownArchetypeTemplate = INITIAL_ARCHETYPES.find(arch => arch.id === 'unknown');

    if (!unknownArchetypeTemplate) {
        console.error("INITIAL_ARCHETYPES is missing the 'unknown' template.");
        return;
    }
    
    const targetUnknownArchetype = migrateArchetypeClass(unknownArchetypeTemplate);

    if (!unknownArchetypeFromStorage) {
      updatedArchetypesWorkingCopy = [targetUnknownArchetype, ...updatedArchetypesWorkingCopy.filter(a => a.id !== 'unknown')];
      needsUpdate = true;
    } else {
      const migratedUnknownInStorage = migrateArchetypeClass(unknownArchetypeFromStorage);
      if (
        migratedUnknownInStorage.gameClass !== targetUnknownArchetype.gameClass || 
        migratedUnknownInStorage.name !== targetUnknownArchetype.name ||
        migratedUnknownInStorage.abbreviation !== targetUnknownArchetype.abbreviation ||
        migratedUnknownInStorage.isDefault !== targetUnknownArchetype.isDefault
      ) { 
        updatedArchetypesWorkingCopy = updatedArchetypesWorkingCopy.map(arch =>
          arch.id === 'unknown' ? { ...targetUnknownArchetype, ...migratedUnknownInStorage, gameClass: targetUnknownArchetype.gameClass } : arch // Prioritize template class, keep other stored edits if any
        );
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setArchetypesInternal(updatedArchetypesWorkingCopy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This effect for unknown archetype runs once on mount

  const setArchetypes = useCallback((value: Archetype[] | ((val: Archetype[]) => Archetype[])) => {
    setArchetypesInternal(value);
  }, [setArchetypesInternal]);


  const addArchetype = (name: string, abbreviation: string, gameClass: GameClass) => {
    const newArchetype: Archetype = {
      id: uuidv4(),
      name,
      abbreviation,
      gameClass,
      isDefault: false, // New archetypes are never default
    };
    setArchetypes(prev => [...prev, newArchetype]);
    return newArchetype;
  };

  const updateArchetype = (updatedArchetype: Archetype) => {
    // For 'unknown' archetype, ensure its ID is not changed
    if (updatedArchetype.id === 'unknown') {
      setArchetypes(prev =>
        prev.map(arch => (arch.id === 'unknown' ? { ...updatedArchetype, id: 'unknown' } : arch))
      );
    } else {
      setArchetypes(prev =>
        prev.map(arch => (arch.id === updatedArchetype.id ? updatedArchetype : arch))
      );
    }
    return updatedArchetype;
  };

  const getArchetypeById = (id: string): Archetype | undefined => {
    return archetypes.map(migrateArchetypeClass).find(arch => arch.id === id);
  };
  
  const deleteArchetype = (id: string) => {
    const archetypeToDelete = archetypes.find(arch => arch.id === id);
    if (archetypeToDelete && archetypeToDelete.id === 'unknown') {
        console.warn(`Attempted to delete the special 'unknown' archetype. Operation aborted.`);
        throw new Error("「不明な相手」デッキタイプは削除できません。");
    }
    setArchetypes(prev => prev.filter(arch => arch.id !== id));
  };

  return { 
    archetypes: archetypes.map(migrateArchetypeClass),
    addArchetype, 
    updateArchetype,
    getArchetypeById, 
    deleteArchetype, 
    setArchetypes 
  };
}

    