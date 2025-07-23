
"use client";

import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useControlPanel } from "@/context/ControlPanelContext";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
    const { setPanelOpen } = useControlPanel();

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileSidebar />
            <div className="relative ml-auto flex-1 md:grow-0">
                 {/* This space can be used for a search bar or other header items in the future */}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="ml-auto"
              onClick={() => setPanelOpen(true)}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="sr-only">Toggle Control Panel</span>
            </Button>
        </header>
    )
}
