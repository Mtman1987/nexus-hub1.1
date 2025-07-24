
"use client";

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ControlPanel } from './control-panel';
import { ScrollArea } from '../ui/scroll-area';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <ScrollArea className="flex-1">
            <main>
              {children}
            </main>
        </ScrollArea>
      </div>
      <ControlPanel />
    </div>
  );
}

    