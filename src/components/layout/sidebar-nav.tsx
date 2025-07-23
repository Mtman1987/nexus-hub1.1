
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Globe, LayoutGrid, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as React from 'react';
import { ALL_MODULES_CONFIG } from '@/lib/modules';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useSidebar } from '@/context/SidebarContext';
import { ScrollArea } from '../ui/scroll-area';

type SidebarNavProps = ComponentProps<'nav'> & {
  isCollapsed?: boolean;
}

export function SidebarNav({ isCollapsed = false, className }: SidebarNavProps) {
  const { hiddenModules, setHiddenModules } = useSidebar();
  
  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    setHiddenModules(prev => {
      if(checked) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  }

  const navClass = "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted";

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <nav className={cn("grid items-start gap-1 p-2 text-base font-medium lg:p-4 flex-grow", className)}>
          {ALL_MODULES_CONFIG.map(module => {
            const Icon = module.icon;
            return(
            <Tooltip key={module.id} delayDuration={0}>
              <TooltipTrigger asChild>
                 <div className={cn(navClass, "justify-center")}>
                   <Checkbox
                      id={`col-vis-${module.id}`}
                      className="mr-2"
                      checked={!hiddenModules.includes(module.id)}
                      onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                   />
                   {Icon && <Icon className="h-5 w-5 text-primary" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {module.title}
              </TooltipContent>
            </Tooltip>
          )})}
        </nav>
      </TooltipProvider>
    );
  }

  return (
      <nav className={cn("flex flex-col items-start gap-1 p-2 text-base font-medium lg:p-4 flex-grow", className)}>
        <Label className="px-3 py-2 text-xs font-semibold text-muted-foreground">MODULE VISIBILITY</Label>
        <ScrollArea className="w-full">
           <div className="grid gap-1 pr-2">
            {ALL_MODULES_CONFIG.map(module => {
                const Icon = module.icon;
                return (
                  <div key={module.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted">
                    <Checkbox
                      id={`vis-${module.id}`}
                      checked={!hiddenModules.includes(module.id)}
                      onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                      />
                    {Icon && <Icon className="h-4 w-4 text-primary" />}
                    <Label htmlFor={`vis-${module.id}`} className="w-full cursor-pointer">{module.title}</Label>
                  </div>
                )
            })}
           </div>
        </ScrollArea>
      </nav>
  );
}
