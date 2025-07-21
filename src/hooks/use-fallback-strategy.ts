
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';

export type ProviderId = 'google' | 'openai' | 'groq';

export type Provider = {
  id: ProviderId;
  name: string;
  description: string;
  keyName: 'googleApiKey' | 'openaiApiKey' | 'groqApiKey';
  priority: number;
};

const ALL_PROVIDERS: Omit<Provider, 'priority'>[] = [
    { id: 'google', name: 'Google AI', description: 'Gemini models', keyName: 'googleApiKey' },
    { id: 'openai', name: 'OpenAI', description: 'GPT models', keyName: 'openaiApiKey' },
    { id: 'groq', name: 'Groq', description: 'Llama models via Groq', keyName: 'groqApiKey' },
];

export function useFallbackStrategy() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const { toast } = useToast();
  const { addLog } = useLogs();
  
  const availableProviderCount = providers.length;

  const loadStrategy = useCallback(() => {
    try {
        if (typeof window === 'undefined') return;
        
        const providerStatus = JSON.parse(localStorage.getItem('providerStatus') || '{}');

        // Only include providers that have an API key AND are enabled
        const availableProviders = ALL_PROVIDERS.filter(p => {
            const hasKey = !!localStorage.getItem(p.keyName);
            const isEnabled = providerStatus[p.id] !== 'disabled'; // enabled by default if not set
            return hasKey && isEnabled;
        });

        const savedStrategyOrder = JSON.parse(localStorage.getItem('fallbackStrategy') || '[]') as ProviderId[];
        
        // Filter the saved order to only include currently available providers
        const orderedProviders = savedStrategyOrder
            .map(id => availableProviders.find(p => p.id === id))
            .filter((p): p is Omit<Provider, 'priority'> => !!p);
        
        // Find any available providers that weren't in the saved order (e.g., newly configured)
        const newProviders = availableProviders.filter(p => !savedStrategyOrder.includes(p.id));
        
        // Combine them and assign priority
        const finalItems = [...orderedProviders, ...newProviders].map((p, index) => ({ ...p, priority: index + 1 }));

        setProviders(finalItems);
        addLog({ service: 'System', level: 'info', message: 'Fallback strategy loaded.', details: `Available providers: ${finalItems.map(p => p.name).join(', ') || 'None'}` });
    } catch(e) {
        console.error("Could not load fallback strategy", e);
        addLog({ service: 'System', level: 'error', message: 'Failed to load fallback strategy from local storage.', details: e instanceof Error ? e.stack : String(e) });
    }
  }, [addLog]);

  useEffect(() => {
    loadStrategy();
    
    // Listen for storage changes to auto-update the UI
    const handleStorageChange = () => loadStrategy();
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }
  }, [loadStrategy]);

  const handlePriorityChange = (providerId: ProviderId, newPriorityStr: string) => {
    const newPriority = parseInt(newPriorityStr, 10);
    let newItems = [...providers];
    const providerToMove = newItems.find(item => item.id === providerId);
    if (!providerToMove) return;

    // Remove the provider from its current position
    newItems = newItems.filter(p => p.id !== providerId);

    // Re-insert it at the new priority position
    newItems.splice(newPriority - 1, 0, providerToMove);

    // Re-assign priorities based on the new array order
    const finalItems = newItems.map((item, index) => ({ ...item, priority: index + 1 }));

    setProviders(finalItems);
  };


  const saveStrategy = () => {
    const strategyOrder = providers.sort((a, b) => a.priority - b.priority).map(item => item.id);
    try {
      localStorage.setItem('fallbackStrategy', JSON.stringify(strategyOrder));
      toast({
        title: "Strategy Saved",
        description: "Your fallback order has been updated.",
      });
      addLog({ service: 'System', level: 'info', message: `User saved new fallback strategy.`, details: `New order: ${strategyOrder.join(' -> ')}` });
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save your strategy. Local storage might be blocked.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: 'Failed to save fallback strategy.', details: error instanceof Error ? error.stack : String(error) });
    }
  };

  return { providers, handlePriorityChange, saveStrategy, availableProviderCount };
}
