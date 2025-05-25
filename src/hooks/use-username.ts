
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import useLocalStorage from './use-local-storage';

const USERNAME_KEY = 'yokolog_current_user';

interface UsernameContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
}

const UsernameContext = createContext<UsernameContextType | undefined>(undefined);

export function UsernameProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useLocalStorage<string | null>(USERNAME_KEY, null);

  const setUsernameCallback = useCallback((newUsername: string | null) => {
    setUsernameState(newUsername);
  }, [setUsernameState]);

  const providerValue: UsernameContextType = {
    username,
    setUsername: setUsernameCallback,
  };

  // Alias the Provider component for clarity in JSX
  const ContextProvider = UsernameContext.Provider;

  return (
    <ContextProvider value={providerValue}>
      {children}
    </ContextProvider>
  );
}

export function useUsername() {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
}
