
"use client";

import React, { ReactNode, FC } from 'react';
import { UsernameContext, type UsernameContextType } from '@/hooks/use-username';

interface UsernameProviderProps {
  children: ReactNode;
  username: string | null;
  setUsername: (username: string | null) => void;
}

export const UsernameProvider: FC<UsernameProviderProps> = ({ children, username, setUsername }) => {
  const providerValue: UsernameContextType = {
    username,
    setUsername,
  };

  return (
    <UsernameContext.Provider value={providerValue}>
      {children}
    </UsernameContext.Provider>
  );
};
