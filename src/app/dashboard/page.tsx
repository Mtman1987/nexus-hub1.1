
"use client";

import * as React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableModule } from '@/components/dashboard/draggable-module';

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
import { ResumeParser } from '@/components/dashboard/resume-parser';
import { AudioTranscription } from '@/components/dashboard/audio-transcription';
import { Translator } from '@/components/dashboard/translator';


// Define all modules with their components
const ALL_MODULES_CONFIG = [
    { id: 'unifiedChat', title: 'Unified Chat', component: UnifiedChat, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'botPersonality', title: 'Bot Personality', component: BotPersonality, defaultSize: 'col-span-1' },
    { id: 'apiSettings', title: 'API Key Vault', component: ApiSettings, defaultSize: 'col-span-1' },
    { id: 'logViewer', title: 'Captain\'s Log', component: LogViewer, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'musicPlayer', title: 'Subspace Comms & Music', component: MusicPlayer, defaultSize: 'col-span-1' },
    { id: 'imageGenerator', title: 'Stargate Imagery', component: ImageGenerator, defaultSize: 'col-span-1' },
    { id: 'resumeParser', title: 'Resume Parser', component: ResumeParser, defaultSize: 'col-span-1' },
    { id: 'audioTranscription', title: 'Audio Transcription', component: AudioTranscription, defaultSize: 'col-span-1' },
    { id: 'translator', title: 'Translator', component: Translator, defaultSize: 'col-span-1' },
    { id: 'timeZoneConverter', title: 'Time Zone Converter', component: TimeZoneConverter, defaultSize: 'col-span-1' },
    { id: 'fallback', title: 'Intelligent Fallback', component: Fallback, defaultSize: 'col-span-1' },
    { id: 'fallbackStrategy', title: 'Fallback Strategy', component: FallbackStrategy, defaultSize: 'col-span-1'},
    { id: 'userRoles', title: 'Access Control', component: UserRoles, defaultSize: 'col-span-1' },
    { id: 'websiteViewer', title: 'Website Viewer', component: WebsiteViewer, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'savedItems', title: 'Saved Items', component: SavedItems, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'loreWeaver', title: 'Lore Weaver', component: LoreWeaver, defaultSize: 'col-span-1' },
];
const defaultModuleOrder = ALL_MODULES_CONFIG.map(m => m.id);


export default function DashboardPage() {
  const { toast } = useToast();
  const { addLog } = useLogs();
  
  const [moduleOrder, setModuleOrder] = React.useState<string[]>(defaultModuleOrder);
  const [hiddenModules, setHiddenModules] = React.useState<string[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const openPopoutsRef = React.useRef<Map<string, Window>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const setupWindowCloseWatcher = React.useCallback((win: Window, id: string, title: string) => {
    const checkWindow = setInterval(() => {
      if (win.closed) {
        clearInterval(checkWindow);
        openPopoutsRef.current.delete(id);
        setHiddenModules(prev => prev.filter(mId => mId !== id)); // Show the module again
        addLog({ service: 'System', level: 'info', message: `Pop-out window for module '${title}' was closed.` });
      }
    }, 500);
  }, [addLog]);

 const openPopoutWindow = React.useCallback((componentId: string, title: string) => {
      const { availWidth, availHeight, availLeft, availTop } = window.screen;
      const popoutWidth = Math.floor(availWidth / 2);
      const popoutHeight = Math.floor(availHeight / 2) - 60; 
      const features = `width=${popoutWidth},height=${popoutHeight},left=${availLeft},top=${availTop},resizable,scrollbars`;
      const url = `/popout/${componentId}?title=${encodeURIComponent(title)}`;
      return window.open(url, `popout-${componentId}-${Date.now()}`, features);
  }, []);

 const handlePopOut = React.useCallback((componentId: string, title: string) => {
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

  React.useEffect(() => {
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
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
  const activeModule = activeId ? ALL_MODULES_CONFIG.find(({ id }) => id === activeId) : null;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-shrink-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-title-foreground">Dashboard</h1>
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleModuleIds} strategy={rectSortingStrategy}>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleModuleIds.map(id => {
                        const moduleConfig = ALL_MODULES_CONFIG.find(m => m.id === id);
                        if (!moduleConfig) return null;
                        
                        return (
                            <DraggableModule key={id} id={id} className={moduleConfig.defaultSize}>
                              <moduleConfig.component
                                onHide={() => handleHideModule(id)} 
                                onPopOut={() => handlePopOut(id, moduleConfig.title)}
                              />
                            </DraggableModule>
                        );
                    })}
                </div>
            </SortableContext>
             <DragOverlay>
                {activeId && activeModule ? (
                    (() => {
                        const ModuleComponent = activeModule.component;
                        return (
                           <div className={activeModule.defaultSize}>
                             <ModuleComponent isPreview={true} />
                           </div>
                        );
                    })()
                ) : null}
            </DragOverlay>
        </DndContext>
        
        {trulyHiddenModules.length > 0 && (
            <Card className="mt-8 bg-card/80">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-title-foreground">
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
  );
}

    