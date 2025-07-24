
"use client";

import { SidebarNav } from './sidebar-nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/context/SidebarContext';
import { PanelLeftClose, PanelRightClose, Eye, EyeOff } from 'lucide-react';
import { CommunityLogo } from '../icons/community-logo';
import { ALL_MODULES_CONFIG } from '@/lib/modules';
import React, { useState, useEffect } from 'react';

export function Sidebar() {
  const { isCollapsed, setCollapsed, setHiddenModules } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleShowAll = () => {
    setHiddenModules([]);
  };
  
  const handleHideAll = () => {
    setHiddenModules(ALL_MODULES_CONFIG.map(m => m.id));
  };

  if (!isClient) {
    // Render a placeholder on the server to avoid layout shift,
    // but without any of the client-side dependent logic.
    return <aside className="h-screen w-64 flex-col border-r bg-card hidden md:flex" />;
  }

  return (
    <aside className={cn(
        "h-screen flex-col border-r bg-card hidden md:flex transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
    )}>
      <>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground overflow-hidden">
                <CommunityLogo className="h-6 w-auto flex-shrink-0" />
                {!isCollapsed && <span className="text-lg whitespace-nowrap text-title-foreground">Apollo Station</span>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!isCollapsed)}>
                {isCollapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>
        <SidebarNav isCollapsed={isCollapsed} />
        <div className="mt-auto p-4 border-t">
            <div className="grid gap-2">
                <Button variant="secondary" size="sm" onClick={handleShowAll} disabled={isCollapsed}>
                    <Eye className="mr-2 h-4 w-4"/>
                    Show All
                </Button>
                <Button variant="destructive" size="sm" onClick={handleHideAll} disabled={isCollapsed}>
                    <EyeOff className="mr-2 h-4 w-4"/>
                    Hide All
                </Button>
            </div>
        </div>
      </>
    </aside>
  );
}
