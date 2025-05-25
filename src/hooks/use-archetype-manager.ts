
import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { Archetype, GameClass } from '@/types';
import { INITIAL_ARCHETYPES, GAME_CLASS_EN_TO_JP } from '@/lib/game-data'; // Import GAME_CLASS_EN_TO_JP
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

  // Data migration effect for class names (Shadowcraft/Bloodcraft to Nightmare) - run once on mount
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
      // If class migration happened, subsequent name cleaning will operate on this migrated data in the next effect
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Data migration effect for cleaning Japanese class names from archetype names
  useEffect(() => {
    let hasNameChanges = false;
    const japaneseClassNamesToRemove = Object.values(GAME_CLASS_EN_TO_JP);
    const oldJapaneseClassNames = ["ネクロマンサー", "ヴァンパイア"]; // In case these were used in names
    const allNamesToRemoveSet = new Set([...japaneseClassNamesToRemove, ...oldJapaneseClassNames]);

    const cleanedNameArchetypes = archetypes.map(arch => {
      let newName = arch.name;
      let nameWasChangedInThisIteration = false;
      allNamesToRemoveSet.forEach(jpClassName => {
        if (newName.includes(jpClassName)) {
          newName = newName.replace(new RegExp(jpClassName, 'g'), '').trim(); // Replace all occurrences
          nameWasChangedInThisIteration = true;
        }
      });
      
      // Remove trailing alphabetic suffixes from old formats if they exist and match a class (e.g. "コントロールE" -> "コントロール")
      // This is less critical now with explicit suffixing but good for cleanup.
      const potentialSuffix = newName.slice(-1);
      const potentialTwoCharSuffix = newName.slice(-2);
      
      const classSuffixes = ["E", "R", "W", "D", "B", "Ni", "Nm"]; // Ni, Nm are two chars

      if (classSuffixes.includes(potentialTwoCharSuffix) && newName.length > 2) {
         newName = newName.slice(0, -2).trim();
         nameWasChangedInThisIteration = true;
      } else if (classSuffixes.includes(potentialSuffix) && newName.length > 1 && !classSuffixes.includes(newName.slice(-2))) { 
         // Avoids removing 'i' from 'Ni' if it was already Ni
         newName = newName.slice(0, -1).trim();
         nameWasChangedInThisIteration = true;
      }


      newName = newName.replace(/\s\s+/g, ' ').trim(); // Remove multiple spaces

      if (nameWasChangedInThisIteration) {
        hasNameChanges = true;
        return { ...arch, name: newName === "" ? "（名称不明）" : newName }; // Prevent empty names
      }
      return arch;
    });

    if (hasNameChanges) {
      setArchetypesInternal(cleanedNameArchetypes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetypes]); // Rerun if archetypes change (e.g. after class migration or manual add)

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
    if (updatedArchetype.isDefault && updatedArchetype.id !== 'unknown') {
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
    if (archetypeToDelete && archetypeToDelete.id === 'unknown') {
        console.warn(`Attempted to delete the special 'unknown' archetype. Operation aborted.`);
        throw new Error("「不明な相手」デッキタイプは削除できません。");
    }
    setArchetypes(prev => prev.filter(arch => arch.id !== id));
  };

  useEffect(() => {
    const currentArchetypesSnapshot = archetypes; 
    let updatedArchetypesWorkingCopy = [...currentArchetypesSnapshot];
    let needsUpdate = false;

    const unknownArchetypeFromStorage = updatedArchetypesWorkingCopy.find(arch => arch.id === 'unknown');
    
    if (!unknownArchetypeFromStorage) {
      const unknownArchetypeTemplate = INITIAL_ARCHETYPES.find(arch => arch.id === 'unknown');
      if (unknownArchetypeTemplate) {
        updatedArchetypesWorkingCopy = [migrateArchetypeClass(unknownArchetypeTemplate), ...updatedArchetypesWorkingCopy.filter(a => a.id !== 'unknown')];
        needsUpdate = true;
      }
    } else {
      const migratedUnknown = migrateArchetypeClass(unknownArchetypeFromStorage);
      if (migratedUnknown.gameClass !== unknownArchetypeFromStorage.gameClass || 
          migratedUnknown.name !== unknownArchetypeFromStorage.name) { 
        updatedArchetypesWorkingCopy = updatedArchetypesWorkingCopy.map(arch =>
          arch.id === 'unknown' ? migratedUnknown : arch
        );
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setArchetypesInternal(updatedArchetypesWorkingCopy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This effect for unknown archetype runs once on mount

  return { 
    archetypes: archetypes.map(migrateArchetypeClass), // Ensure returned archetypes are always class-migrated
    addArchetype, 
    updateArchetype,
    getArchetypeById, 
    deleteArchetype, 
    setArchetypes 
  };
}
