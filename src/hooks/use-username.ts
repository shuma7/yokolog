
"use client";

import React from 'react'; // Explicit React import for JSX and prefixed hooks
import useLocalStorage from './use-local-storage';

const USERNAME_KEY = 'yokolog_current_user';

// Define the context type
interface UsernameContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
}

// Create the context with an undefined initial value, prefixed with React.
const UsernameContext = React.createContext<UsernameContextType | undefined>(undefined);

// Define the Provider component props
interface UsernameProviderProps {
  children: React.ReactNode; // Use React.ReactNode
}

// Define the Provider component using React.FC
export const UsernameProvider: React.FC<UsernameProviderProps> = ({ children }) => {
  const [username, setUsernameState] = useLocalStorage<string | null>(USERNAME_KEY, null);

  // Use React.useCallback
  const setUsernameCallback = React.useCallback((newUsername: string | null) => {
    setUsernameState(newUsername);
  }, [setUsernameState]);

  const providerValue: UsernameContextType = {
    username,
    setUsername: setUsernameCallback,
  };

  return (
    <UsernameContext.Provider value={providerValue}>
      {children}
    </UsernameContext.Provider>
  );
};

// Custom hook to use the username context
export function useUsername(): UsernameContextType {
  // Use React.useContext
  const context = React.useContext(UsernameContext);
  if (context === undefined) {
    // This error is thrown if useUsername is used outside of a UsernameProvider
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
}
