'use client';

import { createContext } from 'react';
import type { Goal, JournalEntry } from '@/lib/types';

interface AppContextType {
  goals: Goal[];
  entries: JournalEntry[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  saveEntry: (goalId: string, date: string, content: string) => void;
  getEntry: (goalId: string, date: string) => JournalEntry | undefined;
  isReady: boolean;
}

export const AppContext = createContext<AppContextType>({
  goals: [],
  entries: [],
  addGoal: () => {},
  updateGoal: () => {},
  deleteGoal: () => {},
  saveEntry: () => {},
  getEntry: () => undefined,
  isReady: false,
});
