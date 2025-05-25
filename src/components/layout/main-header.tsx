"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUsername } from "@/hooks/use-username";
import { Button } from "@/components/ui/button";

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
        {/* <span className="text-sm text-muted-foreground hidden md:inline">
          {username ? `User: ${username}` : "Not logged in"}
        </span> */}
      </div>
    </header>
  );
}
