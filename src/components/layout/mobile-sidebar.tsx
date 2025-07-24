
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { CommandCenterControl } from "../dashboard/command-center-control";
import { useControlPanel } from "@/context/ControlPanelContext";
import React, { useState, useEffect } from 'react';
import { SidebarNav } from "./sidebar-nav";
import { CommunityLogo } from "../icons/community-logo";
import { useSidebar } from "@/context/SidebarContext";
import { ALL_MODULES_CONFIG } from "@/lib/modules";
import { Eye, EyeOff, SlidersHorizontal } from "lucide-react";

export function MobileSidebar() {
  const [isClient, setIsClient] = useState(false);
  const { isPanelOpen, setPanelOpen } = useControlPanel();
  const { setHiddenModules } = useSidebar();
  
  const handleShowAll = () => setHiddenModules([]);
  const handleHideAll = () => setHiddenModules(ALL_MODULES_CONFIG.map(m => m.id));

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80 flex flex-col">
          <div className="flex h-14 flex-shrink-0 items-center border-b px-4 lg:h-[60px] justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground overflow-hidden">
                <CommunityLogo className="h-6 w-auto flex-shrink-0" />
                <span className="text-lg whitespace-nowrap text-title-foreground">Apollo Station</span>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <SidebarNav isCollapsed={false} />
        </div>
        <div className="mt-auto p-4 border-t flex-shrink-0">
            <div className="grid gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPanelOpen(true)}>
                    <SlidersHorizontal className="mr-2 h-4 w-4"/>
                    Settings
                </Button>
                <Button variant="default" size="sm" onClick={handleShowAll}>
                    <Eye className="mr-2 h-4 w-4"/>
                    Show All
                </Button>
                <Button variant="destructive" size="sm" onClick={handleHideAll}>
                    <EyeOff className="mr-2 h-4 w-4"/>
                    Hide All
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
