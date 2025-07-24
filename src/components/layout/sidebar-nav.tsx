
"use client";

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as React from 'react';
import { ALL_MODULES_CONFIG } from '@/lib/modules';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useSidebar } from '@/context/SidebarContext';

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

  const navClass = "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/20";

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <nav className={cn("grid items-start gap-1 p-2 text-base font-medium lg:px-4 pr-2", className)}>
          {ALL_MODULES_CONFIG.map(module => {
            const Icon = module.icon;
            return(
            <Tooltip key={module.id} delayDuration={0}>
              <TooltipTrigger asChild>
                 <div className={cn(navClass, "justify-center px-0")}>
                   {Icon && <Icon className="h-5 w-5 text-secondary" />}
                   <Checkbox
                      id={`col-vis-${module.id}`}
                      className="ml-2 data-[state=checked]:bg-primary"
                      checked={!hiddenModules.includes(module.id)}
                      onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                   />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="text-title-foreground">{module.title}</span>
              </TooltipContent>
            </Tooltip>
          )})}
        </nav>
      </TooltipProvider>
    );
  }

  return (
      <nav className={cn("flex flex-col items-start gap-1 p-2 text-base font-medium lg:p-4", className)}>
        <Label className="px-3 py-2 text-sm font-semibold text-primary">MODULE VISIBILITY</Label>
           <div className="grid gap-1 pr-2 w-full">
            {ALL_MODULES_CONFIG.map(module => {
                const Icon = module.icon;
                return (
                  <div key={module.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/20">
                    <Checkbox
                      id={`vis-${module.id}`}
                      className="data-[state=checked]:bg-primary"
                      checked={!hiddenModules.includes(module.id)}
                      onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                      />
                    {Icon && <Icon className="h-4 w-4 text-secondary" />}
                    <Label htmlFor={`vis-${module.id}`} className="w-full cursor-pointer">{module.title}</Label>
                  </div>
                )
            })}
           </div>
      </nav>
  );
}
