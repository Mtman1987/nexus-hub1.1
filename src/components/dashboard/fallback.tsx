
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLogs } from '@/context/LogContext';
import { PopOutButton } from './pop-out-button';

// Define a placeholder type as the original was removed.
type IntelligentFallbackOutput = {
    recommendation: string;
    reasoning: string;
};


interface FallbackProps {
  isPoppedOut?: boolean;
  onPopOut?: () => void;
}

export function Fallback({ isPoppedOut = false, onPopOut }: FallbackProps) {
    const [prompt, setPrompt] = useState('');
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<IntelligentFallbackOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const handleGetRecommendation = async () => {
        setIsLoading(true);
        setResult(null);
        addLog({ service: 'System', level: 'warn', message: "Intelligent Fallback is disabled because Genkit was removed." });
        toast({
            title: "Feature Disabled",
            description: "This AI feature is currently disabled.",
            variant: "destructive"
        });
        setIsLoading(false);
    }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-accent" />
                Intelligent Fallback
              </CardTitle>
              <CardDescription>
                Get an AI-powered recommendation for the best provider for your specific task.
              </CardDescription>
            </div>
            {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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

        <div className="flex justify-end">
            <Button onClick={handleGetRecommendation} disabled={isLoading || !prompt || !goal}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Get Recommendation
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
