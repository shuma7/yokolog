"use client";

import { v4 as uuidv4 } from 'uuid';
import type { MatchData } from '@/types';
import { useUsername } from './use-username';
import { useEffect, useState, useCallback } from 'react';

export function useMatchLogger() {
  const { username } = useUsername();
  const [matches, setMatches] = useState<MatchData[]>([]);

  const getStorageKey = useCallback((user: string | null) => {
    return user ? `yokolog_match_logs_${user}` : null;
  }, []);

  // Load matches when username changes
  useEffect(() => {
    const storageKey = getStorageKey(username);
    if (storageKey) {
      const item = window.localStorage.getItem(storageKey);
      setMatches(item ? JSON.parse(item) : []);
    } else {
      setMatches([]); // Clear matches if no user or key is null
    }
  }, [username, getStorageKey]);

  const saveMatches = useCallback((updatedMatches: MatchData[], user: string | null) => {
    const storageKey = getStorageKey(user);
    if (storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify(updatedMatches));
    }
  }, [getStorageKey]);

  const addMatch = (data: Omit<MatchData, 'id' | 'timestamp' | 'userId'>) => {
    if (!username) {
      console.warn("Cannot add match: username not set.");
      return null;
    }
    const newMatch: MatchData = {
      ...data,
      id: uuidv4(),
      timestamp: Date.now(),
      userId: username,
    };
    const updatedMatches = [newMatch, ...matches];
    setMatches(updatedMatches);
    saveMatches(updatedMatches, username);
    return newMatch;
  };

  const deleteMatch = (id: string) => {
    if (!username) {
      console.warn("Cannot delete match: username not set.");
      return;
    }
    const updatedMatches = matches.filter(match => match.id !== id);
    setMatches(updatedMatches);
    saveMatches(updatedMatches, username);
  };
  
  const updateMatch = (updatedMatchData: MatchData) => {
    if(!username) {
      console.warn("Cannot update match: username not set.");
      return;
    }
    // Ensure the updated match still has the correct userId or is for the current user
    if (updatedMatchData.userId !== username) {
        console.error("Attempted to update a match that does not belong to the current user.");
        return;
    }
    const updatedMatches = matches.map(m => m.id === updatedMatchData.id ? updatedMatchData : m);
    setMatches(updatedMatches);
    saveMatches(updatedMatches, username);
  };

  return { matches, addMatch, deleteMatch, updateMatch };
}
