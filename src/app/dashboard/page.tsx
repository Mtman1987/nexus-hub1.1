'use client';

import { useContext, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressChart } from '@/components/progress-chart';
import { AppContext } from '@/contexts/app-context';
import { Bot, Loader2 } from 'lucide-react';
import { suggestImprovements } from '@/ai/flows/suggest-improvements';
import type { SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import { useToast } from '@/hooks/use-toast';
import { getIcon } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { generateStartingPrompts } from '@/ai/flows/generate-starting-prompts';

function EmptyState({ onGeneratePrompts, loading }: { onGeneratePrompts: () => void, loading: boolean }) {
  return (
    <div className="text-center">
      <h3 className="text-2xl font-semibold tracking-tight">Welcome to your Dashboard</h3>
      <p className="mt-2 text-muted-foreground">You don't have enough journal entries to show progress yet.</p>
      <p className="mt-1 text-muted-foreground">Start by writing in your journal for a few days.</p>
       <Button onClick={onGeneratePrompts} disabled={loading} className="mt-4">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
        Get Writing Ideas
      </Button>
    </div>
  );
}


export default function DashboardPage() {
  const { goals, entries } = useContext(AppContext);
  const [suggestions, setSuggestions] = useState<SuggestImprovementsOutput['suggestions']>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [prompts, setPrompts] = useState<Record<string, string[]>>({});
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const { toast } = useToast();

  const hasEnoughData = entries.length > 0;

  const handleSuggestImprovements = async () => {
    setIsSuggesting(true);
    try {
      const recentEntries = entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10) // Analyze last 10 entries
        .map(entry => {
          const goal = goals.find(g => g.id === entry.goalId);
          return {
            date: entry.date,
            goalArea: goal?.name || 'Unknown Area',
            entryText: entry.content
          };
        });
      
      if (recentEntries.length === 0) {
        toast({ title: "Not enough data", description: "Write some journal entries first."});
        return;
      }

      const result = await suggestImprovements({ journalEntries: recentEntries });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate suggestions. Please try again.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGeneratePrompts = async () => {
    setIsGeneratingPrompts(true);
    try {
      const goalNames = goals.map(g => g.name);
      if(goalNames.length === 0) return;
      
      const result = await generateStartingPrompts({ lifeAreas: goalNames });
      setPrompts(result);
    } catch(error) {
      console.error(error);
       toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate prompts. Please try again.',
      });
    } finally {
      setIsGeneratingPrompts(false);
    }
  }

  const suggestionsByGoal = useMemo(() => {
    return suggestions.reduce((acc, suggestion) => {
      const goalName = suggestion.goalArea;
      if (!acc[goalName]) {
        acc[goalName] = [];
      }
      acc[goalName].push(suggestion.suggestionText);
      return acc;
    }, {} as Record<string, string[]>);
  }, [suggestions]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Weekly Progress</CardTitle>
            <CardDescription>A look at your journaling activity this week.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasEnoughData ? (
                <div className="h-[350px]">
                  <ProgressChart />
                </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                 <EmptyState onGeneratePrompts={handleGeneratePrompts} loading={isGeneratingPrompts} />
              </div>
            )}
          </CardContent>
        </Card>

        {Object.keys(prompts).length > 0 && (
          <Card>
            <CardHeader>
               <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Lightbulb className="text-primary"/> Writing Prompts
              </CardTitle>
              <CardDescription>Need inspiration? Here are some ideas to get you started.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(prompts).map(([goalName, promptList]) => (
                <Alert key={goalName} className="bg-background">
                  <AlertTitle className="font-semibold">{goalName}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {promptList.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <Bot className="text-primary"/> AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Analyze your recent journal entries to discover trends and get actionable suggestions for improvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(suggestionsByGoal).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(suggestionsByGoal).map(([goalName, goalSuggestions]) => {
                  const goal = goals.find(g => g.name === goalName);
                  const Icon = goal ? getIcon(goal.icon) : Bot;
                  return (
                    <div key={goalName}>
                      <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-accent" />
                        {goalName}
                      </h3>
                      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                        {goalSuggestions.map((text, index) => (
                          <li key={index}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {isSuggesting ? 'Analyzing your entries...' : 'Click the button to get personalized suggestions.'}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleSuggestImprovements} disabled={isSuggesting || !hasEnoughData}>
              {isSuggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              {isSuggesting ? 'Generating...' : 'Generate Suggestions'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
