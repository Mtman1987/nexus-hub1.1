'use client';

import { useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppContext } from '@/contexts/app-context';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Target, Settings, LifeBuoy } from 'lucide-react';
import { getIcon } from '@/components/icons';

export function MainSidebar() {
  const { goals, isReady } = useContext(AppContext);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentGoalId = searchParams.get('goal');

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary fill-current">
                <rect width="256" height="256" fill="none" />
                <path d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm-42,56.9,80,40-80,40Z" />
              </svg>
            </Link>
          </Button>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-semibold font-headline">Apo Navigator</h1>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard">
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/goals'} tooltip="Manage Goals">
              <Link href="/goals">
                <Target />
                <span>Manage Goals</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Your Goal Areas</SidebarGroupLabel>
          <SidebarMenu>
            {isReady && goals.map(goal => {
              const Icon = getIcon(goal.icon);
              return (
                <SidebarMenuItem key={goal.id}>
                  <SidebarMenuButton asChild isActive={pathname === '/' && currentGoalId === goal.id} tooltip={goal.name}>
                    <Link href={`/?goal=${goal.id}`}>
                      <Icon />
                      <span>{goal.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
