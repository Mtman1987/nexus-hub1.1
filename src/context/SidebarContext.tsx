
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

type SidebarContextType = {
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isCollapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, setCollapsed, isMobile, isMobileMenuOpen, setMobileMenuOpen }}>
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
