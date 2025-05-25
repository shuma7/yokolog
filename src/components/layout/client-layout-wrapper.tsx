
"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { UsernameProvider } from '@/components/providers/username-provider';
import useLocalStorage from '@/hooks/use-local-storage';
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider as UiSidebarProvider, SidebarInset } from '@/components/ui/sidebar';

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
  // 'username' state here is the single source of truth read from localStorage
  const [username, setUsername] = useLocalStorage<string | null>('yokolog_current_user', null);
  const [initialStorageChecked, setInitialStorageChecked] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to confirm the initial localStorage read is complete.
    // This helps decide whether to show the spinner, modal, or the main app.
    setInitialStorageChecked(true);
  }, []);

  const handleUsernameSetInModal = (newUsername: string) => {
    setUsername(newUsername); // This updates localStorage and the 'username' state in this component.
  };

  if (!initialStorageChecked) {
    // Show a spinner while the initial localStorage check is in progress
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!username) {
    // If no username is found after the initial check, show the modal
    return <UsernameModal onUsernameSet={handleUsernameSetInModal} />;
  }

  // If a username is set, render the main application,
  // providing the username and setUsername function to the UsernameProvider.
  return (
    <UsernameProvider username={username} setUsername={setUsername}>
      <MainAppContent>{children}</MainAppContent>
    </UsernameProvider>
  );
}
