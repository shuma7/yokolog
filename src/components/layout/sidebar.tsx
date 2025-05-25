"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, ListChecks, PlusSquare, Users, Settings, BotMessageSquare } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar'; // Assuming this is the correct import from shadcn
import { Button } from '@/components/ui/button';
import { useUsername } from '@/hooks/use-username';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/log', label: 'User Log', icon: ListChecks },
  { href: '/matchups', label: 'Matchup Table', icon: BarChart3 },
  { href: '/matches/new', label: 'Add Match', icon: PlusSquare },
  { href: '/archetypes/new', label: 'Add Archetype', icon: BotMessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { username, setUsername } = useUsername();

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
            <rect width="256" height="256" fill="none"></rect>
            <path d="M128,24a104,104,0,1,0,104,104A104.12041,104.12041,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.09957,88.09957,0,0,1,128,216Z" fill="currentColor"></path>
            <path d="M172.37207,76.879a8,8,0,0,0-8.74414,1.16211L128,109.36523l-35.62793-31.3241A8,8,0,0,0,80,83.52148V172.478a8,8,0,0,0,12.37207,6.39942L128,147.63428l35.62793,31.24316A8,8,0,0,0,176,172.478V83.52148a8,8,0,0,0-3.62793-6.64246Z" fill="currentColor" className="text-accent"></path>
          </svg>
          <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">yokolog</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={{children: item.label, side: "right"}}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center p-2">
          <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(username)}`} alt={username || 'User'} data-ai-hint="avatar user" />
            <AvatarFallback>{getInitials(username)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">{username || 'Guest Mode'}</span>
             <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:text-accent" onClick={() => setUsername(null)}>
              Change User
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
