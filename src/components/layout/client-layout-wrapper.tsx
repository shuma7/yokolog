
"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { UsernameProvider } from '@/components/providers/username-provider';
import useLocalStorage from '@/hooks/use-local-storage';
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider as UiSidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useSeasonManager } from '@/hooks/useSeasonManager'; // Import useSeasonManager

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
  const [username, setUsername] = useLocalStorage<string | null>('yokolog_current_user', null);
  const [initialStorageChecked, setInitialStorageChecked] = useState(false);
  const { isLoadingSeasons } = useSeasonManager(); // Use season manager to ensure seasons are loaded

  useEffect(() => {
    setInitialStorageChecked(true);
  }, []);

  const handleUsernameSetInModal = (newUsername: string) => {
    setUsername(newUsername);
  };

  if (!initialStorageChecked || isLoadingSeasons) { // Also wait for seasons to be initialized
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!username) {
    return <UsernameModal onUsernameSet={handleUsernameSetInModal} />;
  }

  return (
    <UsernameProvider username={username} setUsername={setUsername}>
      <MainAppContent>{children}</MainAppContent>
    </UsernameProvider>
  );
}
