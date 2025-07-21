"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, GripVertical, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PopOutButton } from './pop-out-button';
import { useFallbackStrategy } from '@/hooks/use-fallback-strategy';

interface FallbackStrategyProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
}

export function FallbackStrategy({ onPopOut, isPoppedOut = false }: FallbackStrategyProps) {
  const { providers, handlePriorityChange, saveStrategy, availableProviderCount } = useFallbackStrategy();
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-6 w-6 text-accent" />
                Fallback Strategy
              </CardTitle>
              <CardDescription>
                Set the priority order for AI providers when a call fails. Only configured & enabled providers are shown.
              </CardDescription>
            </div>
             {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        {availableProviderCount > 0 ? (
            <div className="space-y-4">
            {providers.map((provider) => (
                <div key={provider.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card-foreground/5">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="flex-grow">
                        <p className="font-semibold">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                    <div>
                        <Select
                            value={String(provider.priority)}
                            onValueChange={(value) => handlePriorityChange(provider.id, value)}
                        >
                            <SelectTrigger className="w-28">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map(p => (
                                    <SelectItem key={`${provider.id}-priority-${p.priority}`} value={String(p.priority)}>
                                        Priority {p.priority}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ))}
            </div>
        ) : (
             <div className="text-center text-muted-foreground py-8">
                <p>No fallback providers are configured and enabled.</p>
                <p className="text-sm">Please add an API key and enable a provider in the API Key Vault.</p>
            </div>
        )}
        <div className="flex justify-end mt-6">
            <Button onClick={saveStrategy} disabled={availableProviderCount === 0}>
                <Save className="mr-2 h-4 w-4" />
                Save Strategy
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
