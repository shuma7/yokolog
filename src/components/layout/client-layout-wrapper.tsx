
"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { UsernameProvider } from '@/components/providers/username-provider';
import useLocalStorage from '@/hooks/use-local-storage';
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider as UiSidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useSeasonManager } from '@/hooks/useSeasonManager'; 

// This component contains the main app UI and will be wrapped by UsernameProvider
function MainAppContent({ children }: { children: ReactNode }) {
  return (
    <UiSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </UiSidebarProvider>
  );
}

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usernameFromStorage, setUsernameInStorage] = useLocalStorage<string | null>('yokolog_current_user', null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [initialStorageChecked, setInitialStorageChecked] = useState(false);
  
  // Use useSeasonManager hook
  const { isLoadingSeasons } = useSeasonManager();


  useEffect(() => {
    // This effect runs once on mount to check localStorage
    setCurrentUsername(usernameFromStorage);
    setInitialStorageChecked(true);
  }, [usernameFromStorage]);

  const handleUsernameSetInModal = (newUsername: string) => {
    setUsernameInStorage(newUsername); // Save to localStorage
    setCurrentUsername(newUsername);   // Update local state for immediate re-render
  };

  // Combine loading conditions
  if (!initialStorageChecked || isLoadingSeasons) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUsername) {
    return <UsernameModal onUsernameSet={handleUsernameSetInModal} />;
  }

  // Pass currentUsername and a setter that updates both state and localStorage
  return (
    <UsernameProvider username={currentUsername} setUsername={(newUsername) => {
      setCurrentUsername(newUsername);
      setUsernameInStorage(newUsername);
    }}>
      <MainAppContent>{children}</MainAppContent>
    </UsernameProvider>
  );
}
