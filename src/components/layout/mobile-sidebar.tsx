
"use client";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, SlidersHorizontal } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { useControlPanel } from "@/context/ControlPanelContext";
import { CommandCenterControl } from "../dashboard/command-center-control";

export function MobileSidebar() {
  const { isPanelOpen, setPanelOpen } = useControlPanel();
  
  return (
    <Sheet open={isPanelOpen} onOpenChange={setPanelOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Control Panel</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-96">
        <CommandCenterControl isPoppedOut={true} />
      </SheetContent>
    </Sheet>
  )
}
