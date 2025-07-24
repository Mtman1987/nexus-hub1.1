
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { CommandCenterControl } from "../dashboard/command-center-control";
import { useControlPanel } from "@/context/ControlPanelContext";
import React, { useState, useEffect } from 'react';

export function MobileSidebar() {
  const { isPanelOpen, setPanelOpen } = useControlPanel();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null;
  }

  return (
    <Sheet open={isPanelOpen} onOpenChange={setPanelOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-96">
        <CommandCenterControl isPoppedOut={true} />
      </SheetContent>
    </Sheet>
  )
}
