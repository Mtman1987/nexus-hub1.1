
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  service: 'Discord' | 'Twitch' | 'Eden' | 'Streamer.bot' | 'System' | string;
  level: LogLevel;
  message: string;
  timestamp: string;
  details?: string; // Optional field for detailed technical info
};

type LogContextType = {
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'timestamp'>) => void;
};

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    {
        service: 'System',
        level: 'info',
        message: 'Log engine initialized.',
        timestamp: formatDistanceToNow(new Date(), { addSuffix: true }),
        details: 'The logging context has been successfully created and is ready to capture events.',
    }
  ]);

  const addLog = useCallback((log: Omit<LogEntry, 'timestamp'>) => {
    const newLog: LogEntry = {
      ...log,
      timestamp: formatDistanceToNow(new Date(), { addSuffix: true }),
    };
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 50)); // Keep last 50 logs
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};
