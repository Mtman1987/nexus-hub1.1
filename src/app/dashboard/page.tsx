
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { LogViewer } from '@/components/dashboard/log-viewer';
import { ApiSettings } from '@/components/dashboard/api-settings';
import { UnifiedChat } from '@/components/dashboard/unified-chat';
import { Save, Trash2, Eye, LayoutGrid, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserRoles } from '@/components/dashboard/user-roles';
import { WebsiteViewer } from '@/components/dashboard/website-viewer';
import { FallbackStrategy } from '@/components/dashboard/fallback-strategy';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLogs } from '@/context/LogContext';
import { SavedItems } from '@/components/dashboard/saved-items';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoreWeaver } from '@/components/dashboard/lore-weaver';
import { TimeZoneConverter } from '@/components/dashboard/timezone-converter';
import { BotPersonality } from '@/components/dashboard/bot-personality';
import { Fallback } from '@/components/dashboard/fallback';
import { ImageGenerator } from '@/components/dashboard/image-generator';
import { MusicPlayer } from '@/components/dashboard/music-player';


// Define all modules with their components
const ALL_MODULES_CONFIG = [
    { id: 'unifiedChat', title: 'Unified Chat', component: UnifiedChat},
    { id: 'botPersonality', title: 'Bot Personality', component: BotPersonality },
    { id: 'apiSettings', title: 'API Key Vault', component: ApiSettings },
    { id: 'logViewer', title: 'Captain\'s Log', component: LogViewer },
    { id: 'musicPlayer', title: 'Subspace Comms & Music', component: MusicPlayer },
    { id: 'imageGenerator', title: 'Stargate Imagery', component: ImageGenerator },
    { id: 'timeZoneConverter', title: 'Time Zone Converter', component: TimeZoneConverter },
    { id: 'fallback', title: 'Intelligent Fallback', component: Fallback },
    { id: 'fallbackStrategy', title: 'Fallback Strategy', component: FallbackStrategy},
    { id: 'userRoles', title: 'Access Control', component: UserRoles },
    { id: 'websiteViewer', title: 'Website Viewer', component: WebsiteViewer },
    { id: 'savedItems', title: 'Saved Items', component: SavedItems },
    { id: 'loreWeaver', title: 'Lore Weaver', component: LoreWeaver },
];
const defaultModuleOrder = ALL_MODULES_CONFIG.map(m => m.id);

// Wrapper component to make modules sortable
const SortableModule = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
        id
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        gridRow: 'span 1 / span 1',
        gridColumn: 'span 1 / span 1',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} >
             {React.cloneElement(children as React.ReactElement, { dragHandleProps: listeners })}
        </div>
    );
};


export default function DashboardPage() {
  const { toast } = useToast();
  const { addLog } = useLogs();
  
  const [moduleOrder, setModuleOrder] = useState<string[]>(defaultModuleOrder);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  
  const openPopoutsRef = React.useRef<Map<string, Window>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const setupWindowCloseWatcher = useCallback((win: Window, id: string, title: string) => {
    const checkWindow = setInterval(() => {
      if (win.closed) {
        clearInterval(checkWindow);
        openPopoutsRef.current.delete(id);
        setHiddenModules(prev => prev.filter(mId => mId !== id)); // Show the module again
        addLog({ service: 'System', level: 'info', message: `Pop-out window for module '${title}' was closed.` });
      }
    }, 500);
  }, [addLog]);

 const openPopoutWindow = useCallback((componentId: string, title: string) => {
      const { availWidth, availHeight, availLeft, availTop } = window.screen;
      const popoutWidth = Math.floor(availWidth / 2);
      const popoutHeight = Math.floor(availHeight / 2) - 60; 
      const features = `width=${popoutWidth},height=${popoutHeight},left=${availLeft},top=${availTop},resizable,scrollbars`;
      const url = `/popout/${componentId}?title=${encodeURIComponent(title)}`;
      return window.open(url, `popout-${componentId}-${Date.now()}`, features);
  }, []);

 const handlePopOut = useCallback((componentId: string, title: string) => {
    if (openPopoutsRef.current.has(componentId)) {
        openPopoutsRef.current.get(componentId)?.focus();
        toast({ title: "Window already open", description: "That module is already in a separate window." });
        return;
    }

    addLog({ service: 'System', level: 'info', message: `User initiated pop-out for module: ${title}.` });
    setHiddenModules(prev => [...prev, componentId]);

    const newWindow = openPopoutWindow(componentId, title);
    if (newWindow) {
        openPopoutsRef.current.set(componentId, newWindow);
        setupWindowCloseWatcher(newWindow, componentId, title);
    } else {
        toast({ title: "Pop-up blocked", description: "Couldn't open window. Please allow pop-ups." });
        setHiddenModules(prev => prev.filter(mId => mId !== componentId));
    }
  }, [toast, openPopoutWindow, setupWindowCloseWatcher, addLog]);

  useEffect(() => {
    try {
        const savedOrder = localStorage.getItem('moduleOrder');
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          // Ensure saved order contains all modules and no duplicates
          const validOrder = defaultModuleOrder.map(id => parsedOrder.includes(id) ? id : null).filter(Boolean) as string[];
          const newModules = defaultModuleOrder.filter(id => !validOrder.includes(id));
          setModuleOrder([...validOrder, ...newModules]);
        }
        const savedHidden = localStorage.getItem('hiddenModules');
        if(savedHidden) setHiddenModules(JSON.parse(savedHidden));
        addLog({ service: 'System', level: 'info', message: 'Dashboard layout restored from local storage.' });
    } catch (error) {
        console.error("Failed to load layout from localStorage", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to load dashboard layout.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [addLog]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModuleOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const handleSaveLayout = () => {
    try {
      localStorage.setItem('moduleOrder', JSON.stringify(moduleOrder));
      localStorage.setItem('hiddenModules', JSON.stringify(hiddenModules));
      toast({
        title: "Layout Saved",
        description: "Your dashboard layout has been saved.",
      });
      addLog({ service: 'System', level: 'info', message: "User saved the dashboard layout." });
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
      openPopoutsRef.current.forEach(popout => popout?.close());
      
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Settings Cleared",
        description: "All local settings have been removed. Reloading application.",
      });
      
      setTimeout(() => window.location.href = '/launcher-ui', 1000);

    } catch (error) {
       toast({
        title: "Clear Failed",
        description: "Could not clear settings. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: "Failed to clear all local settings.", details: error instanceof Error ? error.stack : String(error) });
    }
  };

  const handleHideModule = (moduleId: string) => {
    const module = ALL_MODULES_CONFIG.find(m => m.id === moduleId);
    addLog({ service: 'System', level: 'info', message: `User hid the '${module?.title}' module.` });
    setHiddenModules(prev => [...prev, moduleId]);
  };

  const handleShowModule = (moduleId: string) => {
    const module = ALL_MODULES_CONFIG.find(m => m.id === moduleId);
    addLog({ service: 'System', level: 'info', message: `User restored the '${module?.title}' module.` });
    setHiddenModules(prev => prev.filter(id => id !== moduleId));
  };
  
  const visibleModuleIds = moduleOrder.filter(id => !hiddenModules.includes(id));
  const trulyHiddenModules = ALL_MODULES_CONFIG.filter(m => hiddenModules.includes(m.id));

  return (
    <>
        <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 h-full">
            <div className="flex items-center justify-between flex-shrink-0">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveLayout}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Layout
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Reset All
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
            </div>

            <div className="flex-grow overflow-hidden bg-background/90 p-4 rounded-lg">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={visibleModuleIds} strategy={verticalListSortingStrategy}>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full overflow-y-auto">
                            {visibleModuleIds.map(id => {
                                const moduleConfig = ALL_MODULES_CONFIG.find(m => m.id === id);
                                if (!moduleConfig) return null;
                                
                                const ModuleComponent = moduleConfig.component;
                                return (
                                    <SortableModule key={id} id={id}>
                                      <ModuleComponent
                                        onHide={() => handleHideModule(id)} 
                                        onPopOut={() => handlePopOut(id, moduleConfig.title)}
                                      />
                                    </SortableModule>
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
            
            {trulyHiddenModules.length > 0 && (
                <Card className="mt-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5" />
                            Hidden Modules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {trulyHiddenModules.map(module => (
                            <Button key={module.id} variant="outline" size="sm" onClick={() => handleShowModule(module.id)}>
                                <Eye className="mr-2 h-4 w-4"/>
                                {module.title}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    </>
  );
}

