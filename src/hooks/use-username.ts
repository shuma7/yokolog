
"use client";

import React, { createContext, useContext } from 'react';

// Define the context type
export interface UsernameContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
}

// Create the context.
// The default value for setUsername is a no-op function to satisfy the type;
// it will be overridden by the actual function provided by UsernameProvider.
export const UsernameContext = createContext<UsernameContextType | undefined>({
  username: null,
  setUsername: () => {},
});


// Custom hook to consume the username context
export function useUsername(): UsernameContextType {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    // This error means useUsername was called outside of a UsernameProvider.
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
}
