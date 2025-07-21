
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
import { Monitor, X, LayoutGrid } from 'lucide-react';

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
};

export default function LauncherUI() {
  const [slots, setSlots] = useState<WindowSlot[]>([
    { id: 1, componentKey: null },
    { id: 2, componentKey: null },
    { id: 3, componentKey: null },
    { id: 4, componentKey: null },
  ]);

  const [popOuts, setPopOuts] = useState<{ [key: number]: React.ReactNode }>({});

  const handleSelectChange = (slotId: number, componentKey: string) => {
    setSlots(slots.map(slot => (slot.id === slotId ? { ...slot, componentKey } : slot)));
  };

  const handleLaunch = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || !slot.componentKey) return;

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
    setPopOuts(prev => {
      const newPopOuts = { ...prev };
      delete newPopOuts[slotId];
      return newPopOuts;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {Object.values(popOuts)}
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
             <LayoutGrid className="h-10 w-10 text-accent" />
             Creator Station Launcher
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure and launch up to four modules in a 2x2 grid on your monitor for a powerful command center experience.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slots.map(slot => (
            <Card key={slot.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Monitor Slot {slot.id}</span>
                  {popOuts[slot.id] && (
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
                  disabled={!!popOuts[slot.id]}
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
                    disabled={!slot.componentKey || !!popOuts[slot.id]}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    {popOuts[slot.id] ? 'Launched' : 'Launch in Slot ' + slot.id}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

    