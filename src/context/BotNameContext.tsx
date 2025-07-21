
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type BotNameContextType = {
  botName: string;
  setBotName: (name: string) => void;
};

const BotNameContext = createContext<BotNameContextType | undefined>(undefined);

export const BotNameProvider = ({ children }: { children: ReactNode }) => {
  const [botName, setBotName] = useState('SPCMTN Bot');

  useEffect(() => {
    // Load the bot name from local storage on initial client-side render
    const savedName = localStorage.getItem('botName');
    if (savedName) {
      setBotName(savedName);
    }

    // Listen for storage changes to sync across tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'botName' && event.newValue) {
        setBotName(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSetBotName = (name: string) => {
    setBotName(name);
    // Persist to local storage
    localStorage.setItem('botName', name);
    // Dispatch a storage event to notify other tabs/windows immediately
    window.dispatchEvent(new StorageEvent('storage', { key: 'botName', newValue: name }));
  };

  return (
    <BotNameContext.Provider value={{ botName, setBotName: handleSetBotName }}>
      {children}
    </BotNameContext.Provider>
  );
};

export const useBotName = () => {
  const context = useContext(BotNameContext);
  if (context === undefined) {
    throw new Error('useBotName must be used within a BotNameProvider');
  }
  return context;
};

    