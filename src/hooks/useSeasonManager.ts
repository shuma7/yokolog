
"use client";

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Season } from '@/types';
import useLocalStorage from './use-local-storage';

const SEASONS_KEY = 'yokolog_seasons';
const SELECTED_SEASON_ID_KEY = 'yokolog_selected_season_id';

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
  const [seasons, setSeasons] = useLocalStorage<Season[]>(SEASONS_KEY, []);
  const [selectedSeasonId, setSelectedSeasonIdState] = useLocalStorage<string | null>(SELECTED_SEASON_ID_KEY, null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let currentSeasons = seasons;
    if (currentSeasons.length === 0) {
      const initialSeasonId = uuidv4();
      const initialSeason: Season = {
        id: initialSeasonId,
        name: `初期シーズン (${formatDateForSeasonName(Date.now())} 開始)`,
        startDate: Date.now(),
        endDate: null,
      };
      currentSeasons = [initialSeason];
      setSeasons(currentSeasons);
      setSelectedSeasonIdState(initialSeasonId);
    }

    if (!selectedSeasonId && currentSeasons.length > 0) {
      const active = currentSeasons.find(s => s.endDate === null) || currentSeasons[currentSeasons.length -1];
      setSelectedSeasonIdState(active.id);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to initialize

  const getActiveSeason = useCallback((): Season | undefined => {
    return seasons.find(s => s.endDate === null);
  }, [seasons]);

  const getSelectedSeason = useCallback((): Season | undefined => {
    if (!selectedSeasonId) return getActiveSeason();
    return seasons.find(s => s.id === selectedSeasonId);
  }, [seasons, selectedSeasonId, getActiveSeason]);

  const startNewSeason = useCallback(() => {
    const now = Date.now();
    let newSeasons = [...seasons];
    const currentActiveSeason = newSeasons.find(s => s.endDate === null);

    if (currentActiveSeason) {
      newSeasons = newSeasons.map(s =>
        s.id === currentActiveSeason.id ? { ...s, endDate: now } : s
      );
    }

    const newSeasonId = uuidv4();
    const newActiveSeason: Season = {
      id: newSeasonId,
      name: `シーズン (${formatDateForSeasonName(now)} 開始)`,
      startDate: now,
      endDate: null,
    };
    newSeasons.push(newActiveSeason);
    setSeasons(newSeasons);
    setSelectedSeasonIdState(newSeasonId); // Automatically select the new season for viewing
    return newActiveSeason;
  }, [seasons, setSeasons, setSelectedSeasonIdState]);

  const getAllSeasons = useCallback((): Season[] => {
    return [...seasons].sort((a, b) => b.startDate - a.startDate); // Newest first
  }, [seasons]);

  const setSelectedSeasonId = useCallback((id: string | null) => {
    setSelectedSeasonIdState(id);
  }, [setSelectedSeasonIdState]);

  return {
    seasons,
    isLoadingSeasons: isLoading,
    getActiveSeason,
    getSelectedSeason,
    selectedSeasonId: selectedSeasonId,
    setSelectedSeasonId,
    startNewSeason,
    getAllSeasons,
    formatDateForSeasonName,
  };
}
