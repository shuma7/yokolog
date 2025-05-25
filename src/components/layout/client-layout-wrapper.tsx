
"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { UsernameProvider } from '@/components/providers/username-provider'; // Updated import path
import useLocalStorage from '@/hooks/use-local-storage';
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider as UiSidebarProvider, SidebarInset } from '@/components/ui/sidebar';

// This component will be wrapped by UsernameProvider and contains the main app UI
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
  const [usernameForDecision, setUsernameForDecision] = useLocalStorage<string | null>('yokolog_current_user', null);
  const [initialStorageChecked, setInitialStorageChecked] = useState(false);

  useEffect(() => {
    setInitialStorageChecked(true);
  }, []);

  const handleUsernameSetInModal = (newUsername: string) => {
    setUsernameForDecision(newUsername);
  };

  if (!initialStorageChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!usernameForDecision) {
    return <UsernameModal onUsernameSet={handleUsernameSetInModal} />;
  }

  return (
    <UsernameProvider>
      <MainAppContent>{children}</MainAppContent>
    </UsernameProvider>
  );
}
