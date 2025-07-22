
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Loader2, Wand2, GripVertical, EyeOff, LifeBuoy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getIntelligentFallback } from '@/services/ai';
import type { IntelligentFallbackInput, IntelligentFallbackOutput } from '@/ai/types';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { SetupDialog } from './setup-dialog';
import { ScrollArea } from '../ui/scroll-area';

interface FallbackProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function Fallback({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: FallbackProps) {
    const [prompt, setPrompt] = useState('');
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<IntelligentFallbackOutput | null>(null);
    const [showSetup, setShowSetup] = useState(false);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const handleGetRecommendation = async () => {
        setIsLoading(true);
        setResult(null);

        const logDetails = `Goal: "${goal}", Prompt: "${prompt.substring(0, 100)}..."`;
        addLog({ service: 'System', level: 'info', message: "User requested an Intelligent Fallback recommendation.", details: logDetails });

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
                addLog({ service: 'System', level: 'error', message: "Intelligent Fallback failed: Primary Eden AI API key is missing." });
                setIsLoading(false);
                return;
            }

            const input: IntelligentFallbackInput = {
                prompt,
                goal,
                config,
            };

            const { response, logs } = await getIntelligentFallback(input);
            setResult(response);
            logs.forEach(log => addLog(log));

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setResult({
                recommendation: 'Error',
                reasoning: `The recommendation could not be generated. ${errorMessage}`,
            });
            toast({
                title: "Recommendation Failed",
                description: "An unexpected error occurred. Check the Captain's Log for details.",
                variant: "destructive"
            });
            addLog({ service: 'System', level: 'error', message: `Intelligent Fallback failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <>
    <SetupDialog open={showSetup} onOpenChange={setShowSetup} />
    <Card className="flex flex-col bg-card/80">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-title-foreground">
                  <Lightbulb className="h-6 w-6 text-accent" />
                  Intelligent Fallback
                </CardTitle>
                <CardDescription>
                  Get an AI recommendation for the best provider for your specific task.
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
        <div className="flex-grow space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
                <Label htmlFor="goal">Your Goal</Label>
                <Input id="goal" placeholder="e.g., Write a marketing email, summarize a document" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="prompt">Your Full Prompt</Label>
                <Textarea id="prompt" placeholder="Enter the full prompt you want to send to the AI..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>

            {result && (
                <Alert variant={result.recommendation === 'Error' ? 'destructive' : 'default'}>
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>
                        {result.recommendation === 'Error' ? 'Error' : `Recommendation: ${result.recommendation}`}
                    </AlertTitle>
                    <AlertDescription>
                        {result.reasoning}
                    </AlertDescription>
                </Alert>
            )}
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSetup(true)}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                Setup Wizard
            </Button>
            <Button onClick={handleGetRecommendation} disabled={isLoading || !prompt || !goal}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Get Recommendation
            </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

    