
"use client";

import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import useLocalStorage from './use-local-storage';

const USERNAME_KEY = 'yokolog_current_user';

// Define the context type
export interface UsernameContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
}

// Create the context with an undefined initial value
export const UsernameContext = createContext<UsernameContextType | undefined>(undefined);

// Custom hook to manage the provider's value logic
export function useProvideUsername(): UsernameContextType {
  const [username, setUsernameState] = useLocalStorage<string | null>(USERNAME_KEY, null);

  // Effect to re-sync with localStorage if the hook's state is null but localStorage has a value.
  // This helps bridge any potential timing gap after the modal sets the username.
  useEffect(() => {
    if (username === null && typeof window !== 'undefined') {
      const item = window.localStorage.getItem(USERNAME_KEY);
      const storedUsername = item ? JSON.parse(item) : null;
      if (storedUsername) {
        // Only update if the current state is null and localStorage has a different value.
        // This avoids an infinite loop if setUsernameState itself caused this effect to run.
        setUsernameState(storedUsername);
      }
    }
    // Only re-run if setUsernameState changes (which is stable) or if username was initially null and might need update.
    // The primary goal is to catch the initial desync.
  }, [username, setUsernameState]);

  const setUsernameCallback = useCallback((newUsername: string | null) => {
    setUsernameState(newUsername);
  }, [setUsernameState]);

  return {
    username,
    setUsername: setUsernameCallback,
  };
}

// Custom hook to consume the username context
export function useUsername(): UsernameContextType {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
}
