"use client";

import { useState, useEffect } from 'react';
import { useUsername } from '@/hooks/use-username';
import { UsernameModal } from '@/components/auth/username-modal';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Assuming these are correct imports from shadcn

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { username, setUsername } = useUsername();
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);

  useEffect(() => {
    // This effect ensures that we don't render the UI (or modal) until
    // the username has been loaded from localStorage.
    setIsUsernameChecked(true);
  }, [username]);

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
  };

  if (!isUsernameChecked) {
    // Optional: Render a loading state or null while checking username
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!username) {
    return <UsernameModal onUsernameSet={handleUsernameSet} />;
  }

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
