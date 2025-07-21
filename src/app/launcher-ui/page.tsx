
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PopOutWindow } from '@/components/layout/pop-out-window';
import { ApiSettings } from '@/components/dashboard/api-settings';
import { UnifiedChat } from '@/components/dashboard/unified-chat';
import { LogViewer } from '@/components/dashboard/log-viewer';
import { WebsiteViewer } from '@/components/dashboard/website-viewer';
import { UserRoles } from '@/components/dashboard/user-roles';
import { Fallback } from '@/components/dashboard/fallback';
import { FallbackStrategy } from '@/components/dashboard/fallback-strategy';
import { Monitor, X, LayoutGrid, Home, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { SetupDialog } from '@/components/dashboard/setup-dialog';

const componentMap: { [key: string]: React.ComponentType<{ isPoppedOut?: boolean }> } = {
  apiSettings: ApiSettings,
  unifiedChat: UnifiedChat,
  logViewer: LogViewer,
  websiteViewer: WebsiteViewer,
  userRoles: UserRoles,
  fallback: Fallback,
  fallbackStrategy: FallbackStrategy,
};

const componentOptions = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'unifiedChat', label: 'Unified Chat' },
  { value: 'logViewer', label: 'Captain\'s Log' },
  { value: 'apiSettings', label: 'API Key Vault' },
  { value: 'websiteViewer', label: 'Website Viewer' },
  { value: 'userRoles', label: 'Access Control' },
  { value: 'fallback', label: 'Intelligent Fallback' },
  { value: 'fallbackStrategy', label: 'Fallback Strategy' },
];

type WindowSlot = {
  id: number;
  componentKey: string | null;
  windowInstance: Window | null;
};

export function LauncherUI() {
  const [slots, setSlots] = useState<WindowSlot[]>([
    { id: 1, componentKey: null, windowInstance: null },
    { id: 2, componentKey: null, windowInstance: null },
    { id: 3, componentKey: null, windowInstance: null },
    { id: 4, componentKey: null, windowInstance: null },
  ]);

  const [popOuts, setPopOuts] = useState<{ [key: number]: React.ReactNode }>({});
  const [showSetup, setShowSetup] = useState(false);

  const handleSelectChange = (slotId: number, componentKey: string) => {
    setSlots(slots.map(slot => (slot.id === slotId ? { ...slot, componentKey } : slot)));
  };

  const handleLaunch = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || !slot.componentKey) return;
    
    if (slot.componentKey === 'dashboard') {
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const popoutWidth = Math.floor(screenWidth / 2);
        const popoutHeight = Math.floor(screenHeight / 2);

        let top = 0, left = 0;
        switch (slot.id) {
            case 1: top = 0; left = 0; break;
            case 2: top = 0; left = popoutWidth; break;
            case 3: top = popoutHeight; left = 0; break;
            case 4: top = popoutHeight; left = popoutWidth; break;
        }
        
        const newWindow = window.open('/dashboard', `_blank`, `width=${popoutWidth},height=${popoutHeight},left=${left},top=${top},resizable,scrollbars`);
        setSlots(prev => prev.map(s => s.id === slotId ? {...s, windowInstance: newWindow} : s));
        return;
    }

    const Component = componentMap[slot.componentKey];
    const componentName = componentOptions.find(c => c.value === slot.componentKey)?.label || "Module";

    setPopOuts(prev => ({
      ...prev,
      [slotId]: (
        <PopOutWindow
          onClose={() => handleClose(slotId)}
          title={componentName}
          screenPosition={slotId}
        >
          <Component isPoppedOut={true} />
        </PopOutWindow>
      ),
    }));
  };

  const handleClose = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot?.windowInstance) {
        slot.windowInstance.close();
    }

    setPopOuts(prev => {
      const newPopOuts = { ...prev };
      delete newPopOuts[slotId];
      return newPopOuts;
    });

    setSlots(prev => prev.map(s => s.id === slotId ? {...s, windowInstance: null} : s));
  };
  
  const isLaunched = (slotId: number) => {
      return !!popOuts[slotId] || !!slots.find(s => s.id === slotId)?.windowInstance;
  }

  return (
    <>
    <SetupDialog open={showSetup} onOpenChange={setShowSetup} />
    <div className="min-h-screen bg-background text-foreground p-8">
      {Object.values(popOuts)}
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <LayoutGrid className="h-10 w-10 text-accent" />
              Creator Station Launcher
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and launch modules in a 2x2 grid for your command center.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="link" onClick={() => setShowSetup(true)}>
                <LifeBuoy className="mr-2 h-4 w-4"/>
                New User? Start Here
            </Button>
            <Link href="/dashboard" passHref>
               <Button variant="outline">
                  <Home className="mr-2 h-4 w-4"/>
                  Go to Dashboard
               </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slots.map(slot => (
            <Card key={slot.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Monitor Slot {slot.id}</span>
                  {isLaunched(slot.id) && (
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleClose(slot.id)}>
                        <X className="h-5 w-5" />
                     </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  Select a module to display in this quadrant.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <Select
                  value={slot.componentKey || ''}
                  onValueChange={(value) => handleSelectChange(slot.id, value)}
                  disabled={isLaunched(slot.id)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {componentOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => handleLaunch(slot.id)}
                    disabled={!slot.componentKey || isLaunched(slot.id)}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    {isLaunched(slot.id) ? 'Launched' : 'Launch in Slot ' + slot.id}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
