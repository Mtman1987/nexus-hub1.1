
"use client";

import * as React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableModule } from '@/components/dashboard/draggable-module';

import { Save, Eye, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ALL_MODULES_CONFIG } from '@/lib/modules';
import { CommunityLogo } from '@/components/icons/community-logo';
import { useSidebar } from '@/context/SidebarContext';


const defaultModuleOrder = ALL_MODULES_CONFIG.map(m => m.id);


export default function DashboardPage() {
  const { toast } = useToast();
  const { addLog } = useLogs();
  
  const [moduleOrder, setModuleOrder] = React.useState<string[]>(defaultModuleOrder);
  const { hiddenModules, setHiddenModules } = useSidebar();
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
  }, [addLog, setHiddenModules]);

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
  }, [toast, openPopoutWindow, setupWindowCloseWatcher, addLog, setHiddenModules]);

  React.useEffect(() => {
    try {
        const savedOrder = localStorage.getItem('moduleOrder');
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          const validOrder = defaultModuleOrder.map(id => parsedOrder.includes(id) ? id : null).filter(Boolean) as string[];
          const newModules = defaultModuleOrder.filter(id => !validOrder.includes(id));
          setModuleOrder([...validOrder, ...newModules]);
        }
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
        description: "Your dashboard module positions and visibility have been saved.",
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


  const handleShowModule = (moduleId: string) => {
    const module = ALL_MODULES_CONFIG.find(m => m.id === moduleId);
    const title = module?.title;
    addLog({ service: 'System', level: 'info', message: `User restored the '${title}' module.` });
    setHiddenModules(prev => prev.filter(id => id !== moduleId));
  };
  
  const visibleModuleIds = moduleOrder.filter(id => !hiddenModules.includes(id));
  const trulyHiddenModules = ALL_MODULES_CONFIG.filter(m => hiddenModules.includes(m.id));
  const activeModule = activeId ? ALL_MODULES_CONFIG.find(({ id }) => id === activeId) : null;

  return (
    <div className="flex flex-col p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-shrink-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-title-foreground flex items-center gap-3">
              <CommunityLogo className="h-10 w-auto" />
              Dashboard
            </h1>
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveLayout}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Layout
                </Button>
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
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-title-foreground">
                        <LayoutGrid className="h-5 w-5 text-primary" />
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
