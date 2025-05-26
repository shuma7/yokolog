
"use client";

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Season } from '@/types';
import useLocalStorage from './use-local-storage'; // For selectedSeasonId UI preference
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { useToast } from './use-toast';

const SELECTED_SEASON_ID_KEY = 'yokolog_selected_season_id_firestore'; // Changed key to avoid conflicts

const formatDateForSeasonName = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export function useSeasonManager() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonIdState] = useLocalStorage<string | null>(SELECTED_SEASON_ID_KEY, null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialPopulationDone, setInitialPopulationDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db || Object.keys(db).length === 0) {
      console.warn("Firestore is not initialized. Season manager will not function.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const seasonsCollectionRef = collection(db, 'seasons');
    const q = query(seasonsCollectionRef, orderBy('startDate', 'desc')); // Newest first

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedSeasons: Season[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSeasons.push({ id: doc.id, ...doc.data() } as Season);
      });

      if (fetchedSeasons.length === 0 && !initialPopulationDone) {
        console.log("No seasons found in Firestore, creating initial season...");
        const initialSeasonId = uuidv4();
        const initialSeasonData: Omit<Season, 'id'> = {
          name: `初期シーズン (${formatDateForSeasonName(Date.now())} 開始)`,
          startDate: Date.now(),
          endDate: null,
        };
        try {
          const docRef = doc(db, "seasons", initialSeasonId);
          await setDoc(docRef, initialSeasonData);
          setInitialPopulationDone(true);
          setSelectedSeasonIdState(initialSeasonId); // Select the newly created initial season
          // Snapshot will update `seasons` state
          console.log("Initial season created.");
        } catch (error) {
          console.error("Error creating initial season:", error);
          toast({ title: "エラー", description: "初期シーズンの作成に失敗しました。", variant: "destructive" });
        }
      } else {
        setSeasons(fetchedSeasons);
        if (!selectedSeasonId && fetchedSeasons.length > 0) {
          const active = fetchedSeasons.find(s => s.endDate === null) || fetchedSeasons[0]; // Fallback to newest if no active
          setSelectedSeasonIdState(active.id);
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching seasons:", error);
      toast({ title: "エラー", description: "シーズン情報の読み込みに失敗しました。", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPopulationDone, toast]);

  const getActiveSeason = useCallback((): Season | undefined => {
    return seasons.find(s => s.endDate === null);
  }, [seasons]);

  const getSelectedSeason = useCallback((): Season | undefined => {
    if (!selectedSeasonId) return getActiveSeason();
    return seasons.find(s => s.id === selectedSeasonId);
  }, [seasons, selectedSeasonId, getActiveSeason]);

  const startNewSeason = useCallback(async () => {
    if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return null;
    }
    const now = Date.now();
    const currentActiveSeason = seasons.find(s => s.endDate === null);

    const newSeasonId = uuidv4();
    const newActiveSeasonData: Omit<Season, 'id'> = {
      name: `シーズン (${formatDateForSeasonName(now)} 開始)`,
      startDate: now,
      endDate: null,
    };

    try {
      const batch = writeBatch(db);
      if (currentActiveSeason) {
        const activeSeasonRef = doc(db, 'seasons', currentActiveSeason.id);
        batch.update(activeSeasonRef, { endDate: now });
      }
      const newSeasonRef = doc(db, 'seasons', newSeasonId);
      batch.set(newSeasonRef, newActiveSeasonData);
      await batch.commit();
      
      setSelectedSeasonIdState(newSeasonId); // Automatically select the new season for viewing
      // Snapshot will update the seasons list
      return { id: newSeasonId, ...newActiveSeasonData };
    } catch (error) {
      console.error("Error starting new season:", error);
      toast({ title: "エラー", description: "新シーズンの開始に失敗しました。", variant: "destructive" });
      return null;
    }
  }, [seasons, toast, setSelectedSeasonIdState]);

  const getAllSeasons = useCallback((): Season[] => {
    return [...seasons]; // Already sorted by onSnapshot query
  }, [seasons]);

  const setSelectedSeasonId = useCallback((id: string | null) => {
    setSelectedSeasonIdState(id);
  }, [setSelectedSeasonIdState]);

  return {
    seasons, // Firestore synced seasons
    isLoadingSeasons: isLoading,
    getActiveSeason,
    getSelectedSeason,
    selectedSeasonId: selectedSeasonId, // From localStorage (UI preference)
    setSelectedSeasonId,
    startNewSeason,
    getAllSeasons,
    formatDateForSeasonName,
  };
}
