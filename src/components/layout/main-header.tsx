"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUsername } from "@/hooks/use-username";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react"; // Import an icon for username

interface MainHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function MainHeader({ title, actions }: MainHeaderProps) {
  const { username } = useUsername();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        {actions}
        {username && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCircle className="h-5 w-5" />
            <span>{username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
