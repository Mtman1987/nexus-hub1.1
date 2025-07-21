
"use client";

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ModuleCard } from '@/components/dashboard/module-card';
import { LogViewer } from '@/components/dashboard/log-viewer';
import { Fallback } from '@/components/dashboard/fallback';
import { ApiSettings } from '@/components/dashboard/api-settings';
import { UnifiedChat } from '@/components/dashboard/unified-chat';
import { SetupDialog } from '@/components/dashboard/setup-dialog';
import { Bot, Twitch, Globe, Radio, Settings, Puzzle, Save, Trash2, Expand } from 'lucide-react';
import DiscordLogo from '@/components/icons/discord-logo';
import { SITES } from '@/lib/sites';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CheckedState } from '@radix-ui/react-checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserRoles } from '@/components/dashboard/user-roles';
import { WebsiteViewer } from '@/components/dashboard/website-viewer';
import { FallbackStrategy } from '@/components/dashboard/fallback-strategy';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLogs } from '@/context/LogContext';
import { PopOutButton } from '@/components/dashboard/pop-out-button';
import { useBotName } from '@/context/BotNameContext';
import { Sidebar } from '@/components/layout/sidebar';

type ModuleVisibility = {
  [key: string]: boolean;
};

const defaultVisibility: ModuleVisibility = {
  discord: true,
  eden: true,
  twitch: true,
  website: true,
  streamerBot: true,
  customService: false,
  fallbackStrategy: true,
  apiSettings: true,
  logViewer: true,
  unifiedChat: true,
  userRoles: true,
  websiteViewer: true,
  fallback: true,
};

type WindowRecord = {
  id: string;
  window: Window | null;
};

const OPEN_POPOUTS_KEY = 'nexus-open-popouts';
const RELAUNCH_KEY = 'nexus-relaunch-trigger';
const RELAUNCH_IN_PROGRESS_KEY = 'nexus-relaunch-in-progress';
const DASHBOARD_B_READY_KEY = 'nexus-dashboard-b-ready';

const allModules = [
    { id: 'unifiedChat', title: 'Unified Chat', component: UnifiedChat},
    { id: 'apiSettings', title: 'API Key Vault', component: ApiSettings },
    { id: 'logViewer', title: 'Captain\'s Log', component: LogViewer },
    { id: 'fallback', title: 'Intelligent Fallback', component: Fallback },
    { id: 'fallbackStrategy', title: 'Fallback Strategy', component: FallbackStrategy},
    { id: 'userRoles', title: 'Access Control', component: UserRoles },
    { id: 'websiteViewer', title: 'Website Viewer', component: WebsiteViewer },
];

const topRowModules = allModules.slice(0, 3);
const bottomRowModules = allModules.slice(3);


export default function DashboardPage() {
  const mainSite = SITES['main'];
  const { botName } = useBotName();
  const { toast } = useToast();
  const { addLog } = useLogs();
  
  const [visibleModules, setVisibleModules] = useState<ModuleVisibility>(defaultVisibility);
  const [showSetup, setShowSetup] = useState(false);
  const openPopoutsRef = useRef<Map<string, WindowRecord>>(new Map());

  const setupWindowCloseWatcher = useCallback((win: Window, id: string, title: string) => {
    const checkWindow = setInterval(() => {
      if (win.closed) {
        clearInterval(checkWindow);
        openPopoutsRef.current.delete(id);
        addLog({ service: 'System', level: 'info', message: `Pop-out window for module '${title}' was closed.` });
      }
    }, 500);
  }, [addLog]);

 const openPopoutWindow = useCallback((componentId: string, title: string, options: { positionIndex?: number } = {}) => {
      const { availWidth, availHeight, availLeft, availTop } = window.screen;
      const { positionIndex = 0 } = options;

      const popoutWidth = Math.floor(availWidth / 2);
      const popoutHeight = Math.floor(availHeight / 2) - 60; 
      let xPos, yPos;

      if (positionIndex === 0) { // Top Left
          xPos = availLeft;
          yPos = availTop;
      } else if (positionIndex === 1) { // Bottom Left
          xPos = availLeft;
          yPos = availTop + popoutHeight + 60;
      } else { // Top Right
          xPos = availLeft + popoutWidth;
          yPos = availTop;
      }
      
      const features = `width=${popoutWidth},height=${popoutHeight},left=${xPos},top=${yPos},resizable,scrollbars`;
      const url = `/popout/${componentId}?title=${encodeURIComponent(title)}`;
      return window.open(url, `popout-${componentId}-${Date.now()}`, features);
  }, []);


 const handlePopOut = useCallback((componentId: string, title: string) => {
    if (openPopoutsRef.current.has(componentId)) {
        openPopoutsRef.current.get(componentId)?.window?.focus();
        toast({ title: "Window already open", description: "That module is already in a separate window." });
        return;
    }

    addLog({ service: 'System', level: 'info', message: `User initiated pop-out for module: ${title}.` });

    const openCount = openPopoutsRef.current.size;

    if (openCount < 2) {
        const newWindow = openPopoutWindow(componentId, title, { positionIndex: openCount });
        if (newWindow) {
            const newRecord: WindowRecord = { id: componentId, window: newWindow };
            openPopoutsRef.current.set(componentId, newRecord);
            setupWindowCloseWatcher(newWindow, componentId, title);
        }
    } else if (openCount === 2) {
        const thirdNewWindow = openPopoutWindow(componentId, title, { positionIndex: 2 });
        if (thirdNewWindow) {
            const thirdRecord: WindowRecord = { id: componentId, window: thirdNewWindow };
            openPopoutsRef.current.set(componentId, thirdRecord);
            setupWindowCloseWatcher(thirdNewWindow, componentId, title);
        } else {
            toast({ title: "Pop-up blocked", description: "Couldn't open the third window. Please allow pop-ups." });
            return;
        }

        const popoutIds = Array.from(openPopoutsRef.current.keys());
        localStorage.setItem(OPEN_POPOUTS_KEY, JSON.stringify(popoutIds));
        
        localStorage.setItem(RELAUNCH_KEY, 'true');

        addLog({ service: 'System', level: 'info', message: 'Third pop-out opened, triggering dashboard relaunch into 2x2 grid.', details: `Pop-outs to restore: ${popoutIds.join(', ')}` });

        openPopoutsRef.current.forEach(p => p.window?.close());
        window.close();
    }
  }, [toast, openPopoutWindow, setupWindowCloseWatcher, addLog]);

  const restorePopouts = useCallback(() => {
    try {
        const savedPopoutsJSON = localStorage.getItem(OPEN_POPOUTS_KEY);
        if (savedPopoutsJSON) {
            addLog({ service: 'System', level: 'info', message: 'Relaunched dashboard is restoring pop-out windows from saved state.' });
            const popoutIds: string[] = JSON.parse(savedPopoutsJSON);
            popoutIds.forEach((id, index) => {
                const moduleInfo = allModules.find(m => m.id === id);
                if (moduleInfo) {
                    const newWindow = openPopoutWindow(id, moduleInfo.title, { positionIndex: index });
                    if (newWindow) {
                        const newRecord: WindowRecord = { id: id, window: newWindow };
                        openPopoutsRef.current.set(id, newRecord);
                        setupWindowCloseWatcher(newWindow, id, moduleInfo.title);
                    }
                }
            });
            localStorage.removeItem(OPEN_POPOUTS_KEY); 
        }
    } catch(error) {
        console.error("Failed to load popouts from localStorage", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to restore pop-out windows from local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [openPopoutWindow, setupWindowCloseWatcher, addLog]);

  useEffect(() => {
    const isRelaunch = localStorage.getItem(RELAUNCH_IN_PROGRESS_KEY) === 'true';

    if (isRelaunch) {
        restorePopouts();
        localStorage.removeItem(RELAUNCH_IN_PROGRESS_KEY);
        localStorage.setItem(DASHBOARD_B_READY_KEY, 'true');
    } else {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === DASHBOARD_B_READY_KEY && event.newValue === 'true') {
                addLog({ service: 'System', level: 'info', message: 'New dashboard is ready. Closing original dashboard.' });
                localStorage.removeItem(DASHBOARD_B_READY_KEY);
                openPopoutsRef.current.forEach(p => p.window?.close());
                window.close();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        try {
            const savedVisibility = localStorage.getItem('moduleVisibility');
            if (savedVisibility) setVisibleModules(JSON.parse(savedVisibility));
            addLog({ service: 'System', level: 'info', message: 'Dashboard module visibility restored from local storage.' });
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
            addLog({ service: 'System', level: 'error', message: 'Failed to load dashboard settings.', details: error instanceof Error ? error.stack : String(error) });
        }

        const key = localStorage.getItem('edenApiKey') || localStorage.getItem('googleApiKey');
        if (!key) {
            setShowSetup(true);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }
  }, [restorePopouts, addLog]);
  
  const handleSaveLayout = () => {
    try {
      localStorage.setItem('moduleVisibility', JSON.stringify(visibleModules));
      toast({
        title: "Layout Saved",
        description: "Your dashboard layout has been saved.",
      });
      addLog({ service: 'System', level: 'info', message: "User saved the dashboard layout and module visibility." });
    } catch (error) {
       toast({
        title: "Save Failed",
        description: "Could not save layout. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: "Failed to save dashboard layout.", details: error instanceof Error ? error.stack : String(error) });
    }
  };

  const handleClearSettings = () => {
    try {
      addLog({ service: 'System', level: 'warn', message: 'User initiated reset of all local settings.' });
      openPopoutsRef.current.forEach(popout => popout.window?.close());
      
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Settings Cleared",
        description: "All local settings have been removed. Closing all windows.",
      });
      
      setTimeout(() => window.close(), 1000);

    } catch (error) {
       toast({
        title: "Clear Failed",
        description: "Could not clear settings. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: "Failed to clear all local settings.", details: error instanceof Error ? error.stack : String(error) });
    }
  };

  const handleCheckedChange = (moduleId: string) => (isChecked: CheckedState) => {
    setVisibleModules(prev => ({ ...prev, [moduleId]: !!isChecked }));
  };

  const serviceModules = [
    { id: 'discord', visible: visibleModules.discord, component: <ModuleCard icon={<DiscordLogo className="h-6 w-6 text-indigo-400" />} title="Discord" status="Active" /> },
    { id: 'eden', visible: visibleModules.eden, component: <ModuleCard icon={<Bot className="h-6 w-6 text-cyan-400" />} title={botName} status="Inactive" /> },
    { id: 'twitch', visible: visibleModules.twitch, component: <ModuleCard icon={<Twitch className="h-6 w-6 text-purple-400" />} title="Twitch" status="Active" /> },
    { id: 'website', visible: visibleModules.website, component: <ModuleCard icon={<Globe className="h-6 w-6 text-green-400" />} title={mainSite.name} status="Active" /> },
    { id: 'streamerBot', visible: visibleModules.streamerBot, component: <ModuleCard icon={<Radio className="h-6 w-6 text-orange-400" />} title="Streamer.bot" status="Inactive" /> },
    { id: 'customService', visible: visibleModules.customService, component: <ModuleCard icon={<Puzzle className="h-6 w-6 text-gray-400" />} title="Custom Service" status="Inactive" /> },
  ];
  
  const visibleServiceModules = serviceModules.filter(m => m.visible);

  return (
    <>
      <SetupDialog open={showSetup} onOpenChange={setShowSetup} />
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between flex-shrink-0">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            View Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle Service Modules</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {serviceModules.map(module => (
                            <DropdownMenuCheckboxItem key={module.id} checked={module.visible} onCheckedChange={handleCheckedChange(module.id)}>
                                {module.component.props.title}
                            </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Toggle Tool Modules</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {allModules.map(module => (
                            <DropdownMenuCheckboxItem key={module.id} checked={visibleModules[module.id]} onCheckedChange={handleCheckedChange(module.id)}>
                                {module.title}
                            </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <div className="p-1">
                                <Button className="w-full" size="sm" onClick={handleSaveLayout}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Layout
                                </Button>
                            </div>
                            <div className="p-1">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Reset All Settings
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This will permanently delete all API keys, settings, and layouts from your browser and close all windows.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearSettings}>
                                        Yes, reset everything
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 flex-shrink-0">
                {visibleServiceModules.map(m => <div key={m.id}>{m.component}</div>)}
            </div>
            
             <div className="flex-grow flex flex-col gap-6 overflow-hidden">
                {/* Top Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-[350px]">
                  {topRowModules
                    .filter(m => visibleModules[m.id])
                    .map(m => {
                        const ModuleComponent = m.component;
                        return (
                          <div key={m.id} className="relative h-full">
                            <ModuleComponent isPoppedOut={false} />
                            <div className="absolute top-3 right-3">
                              <PopOutButton onClick={() => handlePopOut(m.id, m.title)} />
                            </div>
                          </div>
                        );
                    })}
                </div>
                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-[350px]">
                  {bottomRowModules
                    .filter(m => visibleModules[m.id])
                    .map(m => {
                       const ModuleComponent = m.component;
                       return (
                          <div key={m.id} className="relative h-full">
                            <ModuleComponent isPoppedOut={false} />
                            <div className="absolute top-3 right-3">
                              <PopOutButton onClick={() => handlePopOut(m.id, m.title)} />
                            </div>
                          </div>
                       );
                    })}
                </div>
            </div>

        </main>
      </div>
    </>
  );
}
