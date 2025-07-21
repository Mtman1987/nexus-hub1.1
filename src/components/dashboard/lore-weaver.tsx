
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Wand2, GripVertical, EyeOff, ScrollText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { loreWeaverFlow } from '@/ai/flows/lore-weaver';
import type { LoreWeaverInput, LoreWeaverOutput } from '@/ai/flows/lore-weaver';

interface LoreWeaverProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
}

export function LoreWeaver({ onPopOut, isPoppedOut = false, onHide, dragHandleProps }: LoreWeaverProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<LoreWeaverOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const handleGetIdea = async () => {
        setIsLoading(true);
        setResult(null);

        const logDetails = `Prompt: "${prompt.substring(0, 100)}..."`;
        addLog({ service: 'System', level: 'info', message: "User requested a lore idea from the Lore Weaver.", details: logDetails });

        try {
            const config: { [key: string]: any } = {};
            const configKeys = ['edenApiKey', 'googleApiKey', 'openaiApiKey', 'groqApiKey', 'providerStatus'];
            configKeys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        config[key] = JSON.parse(item);
                    } catch {
                        config[key] = item;
                    }
                }
            });

            if (!config.edenApiKey) {
                toast({
                    title: "Missing Primary API Key",
                    description: "Please enter your Eden AI API key in the API Vault.",
                    variant: "destructive"
                });
                addLog({ service: 'System', level: 'error', message: "Lore Weaver failed: Primary Eden AI API key is missing." });
                setIsLoading(false);
                return;
            }

            const input: LoreWeaverInput = {
                prompt,
                config,
            };

            const { response, logs } = await loreWeaverFlow(input);
            setResult(response);
            logs.forEach(log => addLog(log));

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setResult({
                response: `The AI returned an error. ${errorMessage}`,
            });
            toast({
                title: "Generation Failed",
                description: "An unexpected error occurred. Check the Captain's Log for details.",
                variant: "destructive"
            });
            addLog({ service: 'System', level: 'error', message: `Lore Weaver failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               {dragHandleProps && (
                <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab">
                  <GripVertical />
                </Button>
              )}
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-6 w-6 text-accent" />
                  Lore Weaver
                </CardTitle>
                <CardDescription>
                  Collaborate with COSMO to expand your universe's lore.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center">
              {!isPoppedOut && onHide && (
                <Button variant="ghost" size="icon" onClick={onHide}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
              {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <div className="space-y-2">
            <Textarea 
                id="prompt" 
                placeholder="Enter a lore idea, e.g., 'A rogue planet made of pure energy' or 'The history of the FTL drive'..." 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24"
            />
        </div>

        {result && (
            <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertTitle>
                    COSMO's Transmission
                </AlertTitle>
                <AlertDescription>
                    <ScrollArea className="h-32 pr-4">
                        <p className="whitespace-pre-wrap">{result.response}</p>
                    </ScrollArea>
                </AlertDescription>
            </Alert>
        )}

        <div className="flex justify-end mt-auto">
            <Button onClick={handleGetIdea} disabled={isLoading || !prompt}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Weave Idea
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
