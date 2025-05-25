
"use client";

import { createContext, useContext, useCallback, ReactNode } from 'react';
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
