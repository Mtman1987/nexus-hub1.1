
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ControlPanelContextType = {
  isPanelOpen: boolean;
  setPanelOpen: (isOpen: boolean) => void;
};

const ControlPanelContext = createContext<ControlPanelContextType | undefined>(undefined);

export const ControlPanelProvider = ({ children }: { children: ReactNode }) => {
  const [isPanelOpen, setPanelOpen] = useState(false);
  
  return (
    <ControlPanelContext.Provider value={{ isPanelOpen, setPanelOpen }}>
      {children}
    </ControlPanelContext.Provider>
  );
};

export const useControlPanel = () => {
  const context = useContext(ControlPanelContext);
  if (context === undefined) {
    throw new Error('useControlPanel must be used within a ControlPanelProvider');
  }
  return context;
};

    