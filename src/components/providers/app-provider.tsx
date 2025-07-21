'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/app-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Goal, JournalEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const defaultGoals: Omit<Goal, 'id' | 'createdAt'>[] = [
  { name: 'Career', icon: 'briefcase' },
  { name: 'Health', icon: 'heart' },
  { name: 'Personal Growth', icon: 'brainCircuit' },
  { name: 'Relationships', icon: 'users' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useLocalStorage<Goal[]>('apo-goals', []);
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('apo-entries', []);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // On first load, if no goals exist, populate with defaults.
    const hasBeenInitialized = localStorage.getItem('apo-initialized');
    if (!hasBeenInitialized && goals.length === 0) {
      const initialGoals = defaultGoals.map(g => ({
        ...g,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      }));
      setGoals(initialGoals);
      localStorage.setItem('apo-initialized', 'true');
    }
    setIsReady(true);
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [...prev, newGoal]);
  }, [setGoals]);

  const updateGoal = useCallback((updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => (g.id === updatedGoal.id ? updatedGoal : g)));
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    // Also delete associated entries
    setEntries(prev => prev.filter(e => e.goalId !== id));
  }, [setGoals, setEntries]);

  const saveEntry = useCallback((goalId: string, date: string, content: string) => {
    const id = `${goalId}-${date}`;
    setEntries(prev => {
      const existingIndex = prev.findIndex(e => e.id === id);
      const newEntry: JournalEntry = { id, goalId, date, content };
      if (existingIndex > -1) {
        const newEntries = [...prev];
        newEntries[existingIndex] = newEntry;
        return newEntries;
      }
      return [...prev, newEntry];
    });
  }, [setEntries]);

  const getEntry = useCallback((goalId: string, date: string): JournalEntry | undefined => {
    return entries.find(e => e.goalId === goalId && e.date === date);
  }, [entries]);

  return (
    <AppContext.Provider
      value={{
        goals,
        entries,
        addGoal,
        updateGoal,
        deleteGoal,
        saveEntry,
        getEntry,
        isReady
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
