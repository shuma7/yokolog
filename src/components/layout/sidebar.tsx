
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ListChecks, PlusSquare, BotMessageSquare } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'; 

const navItems = [
  { href: '/log', label: '個人ログ', icon: ListChecks },
  { href: '/matchups', label: '相性表', icon: BarChart3 },
  { href: '/', label: '対戦追加', icon: PlusSquare }, // Changed href to /
  { href: '/archetypes/new', label: 'デッキタイプ追加', icon: BotMessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/" passHref legacyBehavior>
          <a className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
              <rect width="256" height="256" fill="none"></rect>
              <path d="M128,24a104,104,0,1,0,104,104A104.12041,104.12041,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.09957,88.09957,0,0,1,128,216Z" fill="currentColor"></path>
              <path d="M172.37207,76.879a8,8,0,0,0-8.74414,1.16211L128,109.36523l-35.62793-31.3241A8,8,0,0,0,80,83.52148V172.478a8,8,0,0,0,12.37207,6.39942L128,147.63428l35.62793,31.24316A8,8,0,0,0,176,172.478V83.52148a8,8,0,0,0-3.62793-6.64246Z" fill="currentColor" className="text-accent"></path>
            </svg>
            <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">yokolog</h1>
          </a>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/')}
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
         <div className="flex items-center justify-center p-2 group-data-[collapsible=icon]:justify-center">
            <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">対戦記録アプリ</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
