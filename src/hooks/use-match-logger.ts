"use client";

import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './use-local-storage';
import type { MatchData } from '@/types';
import { useUsername } from './use-username';
import { useEffect, useState } from 'react';

const MATCH_LOGS_KEY_PREFIX = 'yokolog_match_logs_';

export function useMatchLogger() {
  const { username } = useUsername();
  const [userMatchLogsKey, setUserMatchLogsKey] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      setUserMatchLogsKey(`${MATCH_LOGS_KEY_PREFIX}${username}`);
    } else {
      setUserMatchLogsKey(null);
    }
  }, [username]);

  const [matches, setMatchesInternal] = useLocalStorage<MatchData[]>(userMatchLogsKey || '', []);
  
  // This state ensures that we return an empty array if there's no username,
  // preventing useLocalStorage from trying to use an empty key initially.
  const [effectiveMatches, setEffectiveMatches] = useState<MatchData[]>([]);

  useEffect(() => {
    if (username && userMatchLogsKey) {
      setEffectiveMatches(matches);
    } else {
      setEffectiveMatches([]);
    }
  }, [username, userMatchLogsKey, matches]);


  const addMatch = (data: Omit<MatchData, 'id' | 'timestamp' | 'userId'>) => {
    if (!username) {
      // console.error("Cannot add match: username not set."); // Removed to prevent console error, handled by caller
      return null;
    }
    const newMatch: MatchData = {
      ...data,
      id: uuidv4(),
      timestamp: Date.now(),
      userId: username,
    };
    setMatchesInternal(prev => [newMatch, ...prev]);
    return newMatch;
  };

  const deleteMatch = (id: string) => {
    if (!username) return;
    setMatchesInternal(prev => prev.filter(match => match.id !== id));
  };
  
  const updateMatch = (updatedMatch: MatchData) => {
    if(!username) return;
    setMatchesInternal(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  };

  return { matches: effectiveMatches, addMatch, deleteMatch, updateMatch };
}
