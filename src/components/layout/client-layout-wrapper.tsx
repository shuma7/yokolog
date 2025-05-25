
"use client";

import { useState, useEffect } from 'react';
import { useUsername } from '@/hooks/use-username';
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { username, setUsername } = useUsername();
  const [initialStorageChecked, setInitialStorageChecked] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to confirm initial username load from storage.
    setInitialStorageChecked(true);
  }, []); // Empty dependency array: runs only once on mount

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
  };

  if (!initialStorageChecked) {
    // Show spinner until we've had a chance to read from local storage.
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!username) { // If, after checking storage, username is still not set.
    return <UsernameModal onUsernameSet={handleUsernameSet} />;
  }

  // Username is set, render the app.
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
