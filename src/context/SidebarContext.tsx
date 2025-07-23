
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

type SidebarContextType = {
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
  isMobile: boolean;
  hiddenModules: string[];
  setHiddenModules: React.Dispatch<React.SetStateAction<string[]>>;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isCollapsed, setCollapsed] = useState(false);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  
  useEffect(() => {
    try {
        const savedHidden = localStorage.getItem('hiddenModules');
        if(savedHidden) setHiddenModules(JSON.parse(savedHidden));
    } catch (error) {
        console.error("Failed to load hidden modules from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hiddenModules', JSON.stringify(hiddenModules));
  }, [hiddenModules]);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, setCollapsed, isMobile, hiddenModules, setHiddenModules }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
