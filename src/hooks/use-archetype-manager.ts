
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Archetype, GameClass } from '@/types';
import { INITIAL_ARCHETYPES, GAME_CLASS_EN_TO_JP, GAME_CLASS_SUFFIX_MAP } from '@/lib/game-data';
import { db } from '@/lib/firebase'; // Import Firestore instance
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { useToast } from './use-toast';


const migrateArchetypeClass = (archetype: Archetype): Archetype => {
  if ((archetype.gameClass as string) === 'Shadowcraft' || (archetype.gameClass as string) === 'Bloodcraft') {
    return { ...archetype, gameClass: 'Nightmare' as GameClass };
  }
  return archetype;
};

// Helper to clean archetype names (remove Japanese class names and suffixes)
const cleanArchetypeName = (name: string, gameClass: GameClass): string => {
  let newName = name;
  const japaneseClassNamesToRemove = Object.values(GAME_CLASS_EN_TO_JP);
  const oldJapaneseClassNames = ["ネクロマンサー", "ヴァンパイア"]; // Just in case
  const allNamesToRemoveSet = new Set([...japaneseClassNamesToRemove, ...oldJapaneseClassNames]);
  const classSuffixesToRemove = Object.values(GAME_CLASS_SUFFIX_MAP);

  allNamesToRemoveSet.forEach(jpClassName => {
    if (newName.includes(jpClassName)) {
      newName = newName.replace(new RegExp(jpClassName, 'g'), '').trim();
    }
  });

  classSuffixesToRemove.forEach(suffix => {
    // Ensure we only remove suffix if it's at the end and matches the current archetype's class suffix
    if (newName.endsWith(suffix) && suffix === GAME_CLASS_SUFFIX_MAP[gameClass]) {
      newName = newName.slice(0, -suffix.length).trim();
    }
  });
  // Remove suffixes generally if they are still there (e.g. old data)
  classSuffixesToRemove.forEach(suffix => {
      if (newName.endsWith(suffix)) {
          newName = newName.slice(0, -suffix.length).trim();
      }
  });


  newName = newName.replace(/\s\s+/g, ' ').trim();
  return newName === "" ? "（名称不明）" : newName;
};


export function useArchetypeManager() {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialPopulationDone, setInitialPopulationDone] = useState(false);
  const { toast } = useToast();

  // Effect for fetching archetypes from Firestore and handling initial population
  useEffect(() => {
    if (!db || Object.keys(db).length === 0) {
      console.warn("Firestore is not initialized. Archetype manager will not function.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const archetypesCollectionRef = collection(db, 'archetypes');
    // Order by isDefault first (true then false), then by name
    const q = query(archetypesCollectionRef, orderBy("isDefault", "desc"), orderBy("name"));


    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedArchetypes: Archetype[] = [];
      querySnapshot.forEach((doc) => {
        // Ensure id is correctly part of the archetype object
        fetchedArchetypes.push({ ...(doc.data() as Omit<Archetype, 'id'>), id: doc.id });
      });

      if (fetchedArchetypes.length === 0 && !initialPopulationDone) {
        console.log("No archetypes found in Firestore, populating initial archetypes...");
        try {
          const batch = writeBatch(db);
          const migratedInitial = INITIAL_ARCHETYPES.map(migrateArchetypeClass).map(arch => ({
            ...arch,
            name: cleanArchetypeName(arch.name, arch.gameClass)
          }));

          migratedInitial.forEach(arch => {
            const docRef = doc(db, "archetypes", arch.id); // Use predefined ID
            batch.set(docRef, {
              name: arch.name,
              gameClass: arch.gameClass,
              isDefault: arch.isDefault,
            });
          });
          await batch.commit();
          setInitialPopulationDone(true); // Prevent re-population
          // Snapshot will update archetypes state automatically
          console.log("Initial archetypes populated.");
        } catch (error) {
          console.error("Error populating initial archetypes:", error);
          toast({ title: "エラー", description: "初期デッキタイプの書き込みに失敗しました。", variant: "destructive" });
        }
      } else {
         // Apply migrations and name cleaning to fetched data
        const processedArchetypes = fetchedArchetypes.map(arch => {
          const classMigrated = migrateArchetypeClass(arch);
          return {
            ...classMigrated,
            name: cleanArchetypeName(classMigrated.name, classMigrated.gameClass)
          };
        });
        setArchetypes(processedArchetypes);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching archetypes:", error);
      toast({ title: "エラー", description: "デッキタイプの読み込みに失敗しました。", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPopulationDone, toast]);


  const addArchetype = useCallback(async (name: string, gameClass: GameClass): Promise<Archetype | null> => {
    if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return null;
    }
    const cleanedName = cleanArchetypeName(name, gameClass);
    const newArchetypeData = {
      name: cleanedName,
      gameClass,
      isDefault: false, // User-added archetypes are not default
    };
    try {
      const docRef = await addDoc(collection(db, 'archetypes'), newArchetypeData);
      // The onSnapshot listener will update the local state, so no need to setArchetypes here.
      return { id: docRef.id, ...newArchetypeData }; // Return the new archetype with its Firestore ID
    } catch (error) {
      console.error("Error adding archetype to Firestore:", error);
      toast({ title: "エラー", description: "デッキタイプの追加に失敗しました。", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateArchetype = useCallback(async (updatedArchetype: Archetype): Promise<Archetype | null> => {
     if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return null;
    }
    const { id, ...dataToUpdate } = updatedArchetype;
    const cleanedData = {
      ...dataToUpdate,
      name: cleanArchetypeName(dataToUpdate.name, dataToUpdate.gameClass)
    };
    
    const docRef = doc(db, 'archetypes', id);
    try {
      await updateDoc(docRef, cleanedData);
      // Snapshot will update local state
      return updatedArchetype;
    } catch (error) {
      console.error("Error updating archetype in Firestore:", error);
      toast({ title: "エラー", description: "デッキタイプの更新に失敗しました。", variant: "destructive" });
      return null;
    }
  }, [toast]);
  
  const getArchetypeById = useCallback((id: string): Archetype | undefined => {
    // This now gets from the local state which is synced with Firestore
    return archetypes.find(arch => arch.id === id);
  }, [archetypes]);
  
  const deleteArchetype = useCallback(async (id: string) => {
    if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return;
    }
    if (id === 'unknown') {
      toast({ title: "エラー", description: "「不明な相手」デッキタイプは削除できません。", variant: "destructive" });
      return;
    }
    const docRef = doc(db, 'archetypes', id);
    try {
      await deleteDoc(docRef);
      // Snapshot will update local state
      // Note: We also need to update match logs that use this archetypeId.
      // This is complex and ideally handled by a backend function or more careful client-side batching.
      // For now, we'll just delete the archetype definition. The user needs to be aware.
      toast({ title: "削除完了", description: "デッキタイプを削除しました。関連する対戦記録は手動で「不明な相手」などに更新してください。", variant: "default" });

    } catch (error) {
      console.error("Error deleting archetype from Firestore:", error);
      toast({ title: "エラー", description: "デッキタイプの削除に失敗しました。", variant: "destructive" });
    }
  }, [toast]);

  return { 
    archetypes: archetypes, // Already processed with migrations/cleaning by onSnapshot
    addArchetype, 
    updateArchetype,
    getArchetypeById, 
    deleteArchetype, 
    isLoadingArchetypes: isLoading,
  };
}
