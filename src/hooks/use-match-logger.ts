
"use client";

import { v4 as uuidv4 } from 'uuid';
import type { MatchData } from '@/types';
import { useUsername } from './use-username';
import { useEffect, useState, useCallback } from 'react';
import { useSeasonManager } from './useSeasonManager';

// Add selectedSeasonId as a parameter to the hook
export function useMatchLogger(passedSelectedSeasonId: string | null) {
  const { username } = useUsername();
  // Still use useSeasonManager for getActiveSeason, getAllSeasons, isLoadingSeasons
  const { getActiveSeason, getAllSeasons, isLoadingSeasons } = useSeasonManager();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const getStorageKey = useCallback((user: string | null) => {
    return user ? `yokolog_match_logs_${user}` : null;
  }, []);

  useEffect(() => {
    setIsLoadingMatches(true);
    const storageKey = getStorageKey(username);
    if (storageKey && !isLoadingSeasons) {
      const item = window.localStorage.getItem(storageKey);
      let allUserMatches: MatchData[] = item ? JSON.parse(item) : [];
      
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

      if (matchesChanged && username) {
         window.localStorage.setItem(storageKey, JSON.stringify(allUserMatches));
      }

      // Use passedSelectedSeasonId for filtering, fallback to active season if null
      const seasonIdToFilterBy = passedSelectedSeasonId ?? getActiveSeason()?.id;

      if (seasonIdToFilterBy) {
        setMatches([...allUserMatches.filter(match => match.seasonId === seasonIdToFilterBy)].sort((a,b) => b.timestamp - a.timestamp));
      } else {
        setMatches([]); 
      }
    } else {
      setMatches([]); 
    }
    setIsLoadingMatches(false);
  }, [username, passedSelectedSeasonId, getStorageKey, getActiveSeason, getAllSeasons, isLoadingSeasons, isLoadingMatches === false]); // Added isLoadingMatches to re-check after initial load if needed, though primarily driven by other deps

  const saveMatchesToStorage = useCallback((allUserMatches: MatchData[], user: string | null) => {
    const storageKey = getStorageKey(user);
    if (storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify(allUserMatches));
    }
  }, [getStorageKey]);

  const addMatch = (data: Omit<MatchData, 'id' | 'timestamp' | 'userId' | 'seasonId'>) => {
    if (!username) {
      // console.warn("Cannot add match: username not set."); // Removed as per previous request
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

    // Update local state for current view if the new match is in the currently viewed season
    const currentSeasonIdToFilterBy = passedSelectedSeasonId ?? getActiveSeason()?.id;
    if (newMatch.seasonId === currentSeasonIdToFilterBy) {
      setMatches(prev => [...[newMatch, ...prev].sort((a,b) => b.timestamp - a.timestamp)]);
    }
    return newMatch;
  };

  const deleteMatch = (id: string) => {
    if (!username) {
      // console.warn("Cannot delete match: username not set."); // Removed
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
    
    setMatches(prev => [...prev.filter(match => match.id !== id)].sort((a,b) => b.timestamp - a.timestamp));
  };

  const updateMatch = (updatedMatchData: MatchData) => {
    if(!username) {
      // console.warn("Cannot update match: username not set."); // Removed
      return;
    }
    if (updatedMatchData.userId !== username) {
        console.error("Attempted to update a match that does not belong to the current user.");
        return;
    }
    if (!updatedMatchData.seasonId) { 
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

    const currentSeasonIdToFilterBy = passedSelectedSeasonId ?? getActiveSeason()?.id;
    if (updatedMatchData.seasonId === currentSeasonIdToFilterBy) {
        setMatches(prev => [...prev.map(m => m.id === updatedMatchData.id ? updatedMatchData : m)].sort((a,b) => b.timestamp - a.timestamp));
    } else { 
        setMatches(prev => [...prev.filter(m => m.id !== updatedMatchData.id)].sort((a,b) => b.timestamp - a.timestamp));
    }
  };

  return { matches, isLoadingMatches, addMatch, deleteMatch, updateMatch };
}
