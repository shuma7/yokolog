"use client";

import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { MatchData } from '@/types';
// import { useUsername } from './use-username'; // Removed useUsername
import { useEffect, useState } from 'react';

const MATCH_LOGS_KEY_GLOBAL = 'yokolog_match_logs_global'; // Changed to a global key

export function useMatchLogger() {
  // const { username } = useUsername(); // Removed username logic
  // const [userMatchLogsKey, setUserMatchLogsKey] = useState<string | null>(null);

  // useEffect(() => {
  //   if (username) {
  //     setUserMatchLogsKey(`${MATCH_LOGS_KEY_PREFIX}${username}`);
  //   } else {
  //     setUserMatchLogsKey(null);
  //   }
  // }, [username]);

  const [matches, setMatchesInternal] = useLocalStorage<MatchData[]>(MATCH_LOGS_KEY_GLOBAL, []);
  
  // This state ensures that we return an empty array if there's no username,
  // preventing useLocalStorage from trying to use an empty key initially.
  // const [effectiveMatches, setEffectiveMatches] = useState<MatchData[]>([]);

  // useEffect(() => {
  //   if (username && userMatchLogsKey) { // Condition simplified
  //     setEffectiveMatches(matches);
  //   } else {
  //     setEffectiveMatches([]);
  //   }
  // }, [username, userMatchLogsKey, matches]);


  const addMatch = (data: Omit<MatchData, 'id' | 'timestamp' | 'userId'>) => {
    // if (!username) { // Removed username check
    //   return null;
    // }
    const newMatch: MatchData = {
      ...data,
      id: uuidv4(),
      timestamp: Date.now(),
      // userId: username, // Removed userId assignment
    };
    setMatchesInternal(prev => [newMatch, ...prev]);
    return newMatch;
  };

  const deleteMatch = (id: string) => {
    // if (!username) return; // Removed username check
    setMatchesInternal(prev => prev.filter(match => match.id !== id));
  };
  
  const updateMatch = (updatedMatch: MatchData) => {
    // if(!username) return; // Removed username check
    setMatchesInternal(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  };

  return { matches, addMatch, deleteMatch, updateMatch }; // Return matches directly
}
