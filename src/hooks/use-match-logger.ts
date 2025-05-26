
"use client";

import { v4 as uuidv4 } from 'uuid';
import type { MatchData } from '@/types';
import { useUsername } from './use-username';
import { useEffect, useState, useCallback } from 'react';
import { useSeasonManager } from './useSeasonManager'; // Import useSeasonManager

export function useMatchLogger() {
  const { username } = useUsername();
  const { getActiveSeason, selectedSeasonId, getAllSeasons, isLoadingSeasons } = useSeasonManager(); // Use season manager
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const getStorageKey = useCallback((user: string | null) => {
    return user ? `yokolog_match_logs_${user}` : null;
  }, []);

  // Load and filter matches when username or selectedSeasonId changes
  useEffect(() => {
    setIsLoadingMatches(true);
    const storageKey = getStorageKey(username);
    if (storageKey && !isLoadingSeasons) {
      const item = window.localStorage.getItem(storageKey);
      let allUserMatches: MatchData[] = item ? JSON.parse(item) : [];
      
      // Migration for matches without seasonId
      const seasons = getAllSeasons();
      const oldestSeason = seasons.length > 0 ? seasons[seasons.length - 1] : null;

      let matchesChanged = false;
      allUserMatches = allUserMatches.map(match => {
        if (!match.seasonId && oldestSeason) {
          matchesChanged = true;
          return { ...match, seasonId: oldestSeason.id };
        }
        return match;
      });

      if (matchesChanged && username) { // Save migrated matches
         window.localStorage.setItem(storageKey, JSON.stringify(allUserMatches));
      }

      if (selectedSeasonId) {
        setMatches(allUserMatches.filter(match => match.seasonId === selectedSeasonId));
      } else if (getActiveSeason()) { // Fallback to active season if no season is selected (e.g. initial load)
        setMatches(allUserMatches.filter(match => match.seasonId === getActiveSeason()?.id));
      } else {
        setMatches([]); // No season context, show no matches
      }
    } else {
      setMatches([]); // Clear matches if no user or key is null, or seasons are loading
    }
    setIsLoadingMatches(false);
  }, [username, selectedSeasonId, getStorageKey, getActiveSeason, getAllSeasons, isLoadingSeasons]);

  const saveMatchesToStorage = useCallback((allUserMatches: MatchData[], user: string | null) => {
    const storageKey = getStorageKey(user);
    if (storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify(allUserMatches));
    }
  }, [getStorageKey]);

  const addMatch = (data: Omit<MatchData, 'id' | 'timestamp' | 'userId' | 'seasonId'>) => {
    if (!username) {
      console.warn("Cannot add match: username not set.");
      return null;
    }
    const activeSeason = getActiveSeason();
    if (!activeSeason) {
      console.error("Cannot add match: no active season found.");
      return null;
    }

    const newMatch: MatchData = {
      ...data,
      id: uuidv4(),
      timestamp: Date.now(),
      userId: username,
      seasonId: activeSeason.id,
    };

    const storageKey = getStorageKey(username);
    let allUserMatches: MatchData[] = [];
    if (storageKey) {
        const item = window.localStorage.getItem(storageKey);
        allUserMatches = item ? JSON.parse(item) : [];
    }
    
    const updatedAllUserMatches = [newMatch, ...allUserMatches];
    saveMatchesToStorage(updatedAllUserMatches, username);

    // Update local state for current view
    if (newMatch.seasonId === selectedSeasonId) {
      setMatches(prev => [newMatch, ...prev]);
    }
    return newMatch;
  };

  const deleteMatch = (id: string) => {
    if (!username) {
      console.warn("Cannot delete match: username not set.");
      return;
    }
    const storageKey = getStorageKey(username);
    let allUserMatches: MatchData[] = [];
    if (storageKey) {
        const item = window.localStorage.getItem(storageKey);
        allUserMatches = item ? JSON.parse(item) : [];
    }

    const updatedAllUserMatches = allUserMatches.filter(match => match.id !== id);
    saveMatchesToStorage(updatedAllUserMatches, username);
    
    // Update local state for current view
    setMatches(prev => prev.filter(match => match.id !== id));
  };

  const updateMatch = (updatedMatchData: MatchData) => {
    if(!username) {
      console.warn("Cannot update match: username not set.");
      return;
    }
    if (updatedMatchData.userId !== username) {
        console.error("Attempted to update a match that does not belong to the current user.");
        return;
    }
    if (!updatedMatchData.seasonId) { // Ensure seasonId is present, assign to active if missing
        const activeSeason = getActiveSeason();
        if (activeSeason) {
            updatedMatchData.seasonId = activeSeason.id;
        } else {
            console.error("Cannot update match: no active season to assign.");
            return;
        }
    }

    const storageKey = getStorageKey(username);
    let allUserMatches: MatchData[] = [];
    if (storageKey) {
        const item = window.localStorage.getItem(storageKey);
        allUserMatches = item ? JSON.parse(item) : [];
    }
    
    const updatedAllUserMatches = allUserMatches.map(m => m.id === updatedMatchData.id ? updatedMatchData : m);
    saveMatchesToStorage(updatedAllUserMatches, username);

    // Update local state for current view
    if (updatedMatchData.seasonId === selectedSeasonId) {
        setMatches(prev => prev.map(m => m.id === updatedMatchData.id ? updatedMatchData : m));
    } else { // If season changed, remove from current view
        setMatches(prev => prev.filter(m => m.id !== updatedMatchData.id));
    }
  };

  return { matches, isLoadingMatches, addMatch, deleteMatch, updateMatch };
}
