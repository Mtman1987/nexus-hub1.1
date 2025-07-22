
"use client";

import { SidebarNav } from './sidebar-nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/context/SidebarContext';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { CommunityLogo } from '../icons/community-logo';

export function Sidebar() {
  const { isCollapsed, setCollapsed } = useSidebar();

  return (
    <aside className={cn(
        "h-screen flex-col border-r bg-card hidden md:flex transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
    )}>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] justify-between">
            <div className="flex items-center gap-2 font-semibold text-primary">
                <CommunityLogo className="h-8 w-8" />
                {!isCollapsed && <span className="text-lg">Space Mountain</span>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!isCollapsed)}>
                {isCollapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>
        <SidebarNav isCollapsed={isCollapsed} />
        <div className="mt-auto p-4">
            <div className={cn("text-xs text-muted-foreground", isCollapsed ? "text-center" : "text-left")}>
                {!isCollapsed && "© 2024 mtman1987"}
            </div>
        </div>
    </aside>
  );
}
