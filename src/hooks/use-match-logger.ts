
"use client";

import { v4 as uuidv4 } from 'uuid';
import type { MatchData } from '@/types';
import { useUsername } from './use-username';
import { useEffect, useState, useCallback } from 'react';
import { useSeasonManager } from './useSeasonManager';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp, // For Firestore timestamp, if needed
} from 'firebase/firestore';
import { useToast } from './use-toast';


export function useMatchLogger(passedSelectedSeasonId: string | null) {
  const { username } = useUsername();
  const { getActiveSeason, isLoadingSeasons } = useSeasonManager(); // Only getActiveSeason for new matches if no passedSelectedSeasonId
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!username || !passedSelectedSeasonId || isLoadingSeasons) {
      setMatches([]);
      setIsLoadingMatches(username && passedSelectedSeasonId ? true : false); // Only loading if we expect data
      if (!username) console.log("MatchLogger: No username, clearing matches.");
      if (!passedSelectedSeasonId) console.log("MatchLogger: No selected season ID, clearing matches.");
      return;
    }

    if (!db || Object.keys(db).length === 0) {
      console.warn("Firestore is not initialized. Match logger will not function.");
      setIsLoadingMatches(false);
      return;
    }
    
    setIsLoadingMatches(true);
    console.log(`MatchLogger: Subscribing to matches for user "${username}", season "${passedSelectedSeasonId}"`);

    const matchesCollectionRef = collection(db, 'matches');
    const q = query(
      matchesCollectionRef,
      where('userId', '==', username),
      where('seasonId', '==', passedSelectedSeasonId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMatches: MatchData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMatches.push({ id: doc.id, ...doc.data() } as MatchData);
      });
      setMatches(fetchedMatches);
      setIsLoadingMatches(false);
      console.log(`MatchLogger: Fetched ${fetchedMatches.length} matches.`);
    }, (error) => {
      console.error(`Error fetching matches for user "${username}", season "${passedSelectedSeasonId}":`, error);
      toast({ title: "エラー", description: "対戦記録の読み込みに失敗しました。", variant: "destructive" });
      setIsLoadingMatches(false);
    });

    return () => {
      console.log(`MatchLogger: Unsubscribing from matches for user "${username}", season "${passedSelectedSeasonId}"`);
      unsubscribe();
    };
  }, [username, passedSelectedSeasonId, isLoadingSeasons, toast]);


  const addMatch = useCallback(async (data: Omit<MatchData, 'id' | 'timestamp' | 'userId' | 'seasonId'>) => {
    if (!username) {
      toast({ title: "エラー", description: "ユーザー名が設定されていません。", variant: "destructive" });
      return null;
    }
    if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return null;
    }
    
    const activeSeason = getActiveSeason(); // Season for new match is always the current *active* season
    if (!activeSeason) {
      toast({ title: "エラー", description: "記録対象のアクティブなシーズンがありません。", variant: "destructive" });
      return null;
    }

    const newMatchData: Omit<MatchData, 'id'> = {
      ...data,
      timestamp: Date.now(), // Client-side timestamp for simplicity
      userId: username,
      seasonId: activeSeason.id,
    };

    try {
      const docRef = await addDoc(collection(db, 'matches'), newMatchData);
      // If the new match is for the currently viewed season, Firestore listener will update state.
      // If it's for a different (active) season than viewed, the local state for *viewed* season won't change here.
      return { id: docRef.id, ...newMatchData };
    } catch (error) {
      console.error("Error adding match to Firestore:", error);
      toast({ title: "エラー", description: "対戦記録の追加に失敗しました。", variant: "destructive" });
      return null;
    }
  }, [username, getActiveSeason, toast]);

  const deleteMatch = useCallback(async (id: string) => {
    if (!username) {
      toast({ title: "エラー", description: "ユーザー名が設定されていません。", variant: "destructive" });
      return;
    }
     if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return;
    }
    const docRef = doc(db, 'matches', id);
    try {
      // Before deleting, ensure the match belongs to the current user for safety,
      // though Firestore rules should ideally enforce this.
      // const matchToDelete = matches.find(m => m.id === id);
      // if (matchToDelete && matchToDelete.userId !== username) {
      //   toast({ title: "エラー", description: "権限がありません。", variant: "destructive" });
      //   return;
      // }
      await deleteDoc(docRef);
      // Firestore listener will update state.
    } catch (error) {
      console.error("Error deleting match from Firestore:", error);
      toast({ title: "エラー", description: "対戦記録の削除に失敗しました。", variant: "destructive" });
    }
  }, [username, toast]);

  const updateMatch = useCallback(async (updatedMatchData: MatchData) => {
    if (!username) {
      toast({ title: "エラー", description: "ユーザー名が設定されていません。", variant: "destructive" });
      return;
    }
    if (!db || Object.keys(db).length === 0) {
      toast({ title: "エラー", description: "データベース接続がありません。", variant: "destructive" });
      return;
    }
    if (updatedMatchData.userId !== username) {
      toast({ title: "エラー", description: "この記録は更新できません（ユーザー不一致）。", variant: "destructive" });
      return;
    }
    if (!updatedMatchData.seasonId) {
        const currentActiveSeason = getActiveSeason();
        if (currentActiveSeason) {
            updatedMatchData.seasonId = currentActiveSeason.id;
        } else {
            toast({ title: "エラー", description: "有効なシーズンが見つからず更新できません。", variant: "destructive" });
            return;
        }
    }

    const { id, ...dataToUpdate } = updatedMatchData;
    const docRef = doc(db, 'matches', id);
    try {
      await updateDoc(docRef, dataToUpdate);
      // Firestore listener will update state if it's for the viewed season.
    } catch (error) {
      console.error("Error updating match in Firestore:", error);
      toast({ title: "エラー", description: "対戦記録の更新に失敗しました。", variant: "destructive" });
    }
  }, [username, getActiveSeason, toast]);

  return { matches, isLoadingMatches, addMatch, deleteMatch, updateMatch };
}
