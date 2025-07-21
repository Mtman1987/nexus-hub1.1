"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { ModuleCard } from '@/components/dashboard/module-card';
import { LogViewer } from '@/components/dashboard/log-viewer';
import { Fallback } from '@/components/dashboard/fallback';
import { ApiSettings } from '@/components/dashboard/api-settings';
import { UnifiedChat } from '@/components/dashboard/unified-chat';
import { SetupDialog } from '@/components/dashboard/setup-dialog';
import { Bot, Twitch, Globe, Radio, Settings, Puzzle, Shuffle, BookText, Save, Users, Trash2 } from 'lucide-react';
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
import { useBotName } from '@/context/BotNameContext';
import { PopOutWindow } from '@/components/layout/pop-out-window';
import { PopOutButton } from '@/components/dashboard/pop-out-button';
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

type ToolModule = {
  id: string;
  title: string;
  component: React.ComponentType<{ isPoppedOut?: boolean }>;
};

const topRowModules: ToolModule[] = [
    { id: 'unifiedChat', title: 'Unified Chat', component: UnifiedChat},
    { id: 'apiSettings', title: 'API Key Vault', component: ApiSettings },
    { id: 'logViewer', title: 'Captain\'s Log', component: LogViewer },
];

const bottomRowModules: ToolModule[] = [
    { id: 'fallback', title: 'Intelligent Fallback', component: Fallback },
    { id: 'fallbackStrategy', title: 'Fallback Strategy', component: FallbackStrategy},
    { id: 'userRoles', title: 'Access Control', component: UserRoles },
    { id: 'websiteViewer', title: 'Website Viewer', component: WebsiteViewer },
];

const allToolModules = [...topRowModules, ...bottomRowModules];


export default function DashboardPage() {
  const mainSite = SITES['main'];
  const { botName } = useBotName();
  const { toast } = useToast();
  const { addLog } = useLogs();
  
  const [visibleModules, setVisibleModules] = useState<ModuleVisibility>(defaultVisibility);
  const [poppedOutModules, setPoppedOutModules] = useState<string[]>([]);
  
  useEffect(() => {
    try {
        const savedVisibility = localStorage.getItem('moduleVisibility');
        if (savedVisibility) {
             setVisibleModules(JSON.parse(savedVisibility));
        } else {
             setVisibleModules(defaultVisibility);
        }
        addLog({ service: 'System', level: 'info', message: 'Dashboard module visibility restored from local storage.' });
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to load dashboard settings from local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [addLog]);

  const handlePopOut = (moduleId: string) => {
    setPoppedOutModules(prev => [...prev, moduleId]);
  };

  const handlePopIn = (moduleId: string) => {
    setPoppedOutModules(prev => prev.filter(id => id !== moduleId));
  };
  
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
      
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Settings Cleared",
        description: "All local settings have been removed. The page will now reload.",
      });
      
      setTimeout(() => window.location.reload(), 1000);

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
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto">
      
        {allToolModules.map(m =>
            poppedOutModules.includes(m.id) && (
            <PopOutWindow key={`popout-${m.id}`} onClose={() => handlePopIn(m.id)} title={m.title}>
                {React.createElement(m.component, { isPoppedOut: true })}
            </PopOutWindow>
            )
        )}

        <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 space-y-6">
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
                        {allToolModules.map(module => (
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
                                    This will permanently delete all API keys, settings, and layouts from your browser and reload the page.
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
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full">
                  {topRowModules
                    .filter(m => visibleModules[m.id] && !poppedOutModules.includes(m.id))
                    .map(m => (
                      <div key={m.id} className="relative h-full">
                        {React.createElement(m.component, { isPoppedOut: false })}
                        <div className="absolute top-3 right-3">
                          <PopOutButton onClick={() => handlePopOut(m.id)} />
                        </div>
                      </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-full">
                  {bottomRowModules
                    .filter(m => visibleModules[m.id] && !poppedOutModules.includes(m.id))
                    .map(m => (
                      <div key={m.id} className="relative h-full">
                        {React.createElement(m.component, { isPoppedOut: false })}
                        <div className="absolute top-3 right-3">
                          <PopOutButton onClick={() => handlePopOut(m.id)} />
                        </div>
                      </div>
                  ))}
                </div>
            </div>

        </div>
      </main>
    </div>
    </>
  );
}
