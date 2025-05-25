
"use client";

import React, { ReactNode, FC } from 'react';
import { UsernameContext, useProvideUsername, type UsernameContextType } from '@/hooks/use-username';

interface UsernameProviderProps {
  children: ReactNode;
}

export const UsernameProvider: FC<UsernameProviderProps> = ({ children }) => {
  const providerValue = useProvideUsername();

  return (
    <UsernameContext.Provider value={providerValue}>
      {children}
    </UsernameContext.Provider>
  );
};
