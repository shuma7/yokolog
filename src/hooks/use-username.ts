
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import useLocalStorage from './use-local-storage';

const USERNAME_KEY = 'yokolog_current_user';

// Define the context type
interface UsernameContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
}

// Create the context with an undefined initial value
const UsernameContext = createContext<UsernameContextType | undefined>(undefined);

type UsernameProviderProps = {
  children: ReactNode;
};

// Define the Provider component
export function UsernameProvider({ children }: UsernameProviderProps) {
  const [username, setUsernameState] = useLocalStorage<string | null>(USERNAME_KEY, null);

  const setUsernameCallback = useCallback((newUsername: string | null) => {
    setUsernameState(newUsername);
  }, [setUsernameState]);

  // The value to be provided by the context
  const providerValue: UsernameContextType = {
    username,
    setUsername: setUsernameCallback,
  };

  return (
    <UsernameContext.Provider value={providerValue}>
      {children}
    </UsernameContext.Provider>
  );
}

// Custom hook to use the username context
export function useUsername() {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    // This error is thrown if useUsername is used outside of a UsernameProvider
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
}
