
"use client";

import { Button } from "../ui/button";
import { MobileSidebar } from "./mobile-sidebar";
import { PanelTopOpen } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileSidebar />
            
            {/* Placeholder for future Command Center */}
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <PanelTopOpen className="h-4 w-4" />
                <span className="sr-only">Open Command Center</span>
            </Button>
        </header>
    )
}
