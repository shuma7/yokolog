
"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { UsernameProvider } from '@/hooks/use-username'; // Import the new Provider
import useActualLocalStorage from '@/hooks/use-local-storage'; // To decide if modal is needed
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider as UiSidebarProvider, SidebarInset } from '@/components/ui/sidebar';

// This component will be wrapped by UsernameProvider and contains the main app UI
function MainAppContent({ children }: { children: ReactNode }) {
  // Components inside here (like AppSidebar, and the page {children})
  // can now call useUsername() and get the synchronized context value.
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
  // ClientLayoutWrapper uses its own instance of useActualLocalStorage
  // to decide whether to show the modal or the main app.
  const [usernameForDecision, setUsernameForDecision] = useActualLocalStorage<string | null>('yokolog_current_user', null);
  const [initialStorageChecked, setInitialStorageChecked] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to confirm initial username load from storage.
    setInitialStorageChecked(true);
  }, []); // Empty dependency array: runs only once on mount

  const handleUsernameSetInModal = (newUsername: string) => {
    setUsernameForDecision(newUsername); // This updates local storage and ClientLayoutWrapper's state
  };

  if (!initialStorageChecked) {
    // Show spinner until we've had a chance to read from local storage.
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!usernameForDecision) {
    // If username (from ClientLayoutWrapper's direct localStorage check) is not set, show modal.
    return <UsernameModal onUsernameSet={handleUsernameSetInModal} />;
  }

  // Username IS set from ClientLayoutWrapper's perspective.
  // Now, render the UsernameProvider, which will also read from localStorage
  // (effectively getting the same value) and provide it via context to the rest of the app.
  return (
    <UsernameProvider>
      <MainAppContent>{children}</MainAppContent>
    </UsernameProvider>
  );
}
