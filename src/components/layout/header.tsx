
"use client";

import { Button } from "../ui/button";
import { MobileSidebar } from "./mobile-sidebar";
import { PanelTopOpen } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useControlPanel } from "@/context/ControlPanelContext";

export function Header() {
    const [isClient, setIsClient] = useState(false);
    const { setPanelOpen } = useControlPanel();

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // Render a static placeholder on the server to avoid hydration mismatch
        return <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6" />;
    }

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileSidebar />
            
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8" onClick={() => setPanelOpen(true)}>
                <PanelTopOpen className="h-4 w-4" />
                <span className="sr-only">Open Command Center</span>
            </Button>
        </header>
    )
}
