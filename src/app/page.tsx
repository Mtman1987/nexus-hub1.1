'use client';

import { Suspense, useContext, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppContext } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Bot, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { summarizeDailyProgress } from '@/ai/flows/summarize-daily-progress';
import { useToast } from '@/hooks/use-toast';
import { getIcon } from '@/components/icons';
import Image from 'next/image';

function JournalPage() {
  const { goals, getEntry, saveEntry } = useContext(AppContext);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entryContent, setEntryContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);
  const GoalIcon = selectedGoal ? getIcon(selectedGoal.icon) : null;

  useEffect(() => {
    const goalId = searchParams.get('goal');
    if (goalId) {
      setSelectedGoalId(goalId);
    } else if (goals.length > 0) {
      setSelectedGoalId(goals[0].id);
    }
  }, [searchParams, goals]);

  useEffect(() => {
    if (selectedGoalId) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const entry = getEntry(selectedGoalId, dateString);
      setEntryContent(entry?.content || '');
      setSummary(null);
    }
  }, [selectedGoalId, selectedDate, getEntry]);

  const handleSave = () => {
    if (selectedGoalId) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      saveEntry(selectedGoalId, dateString, entryContent);
      toast({
        title: 'Entry Saved',
        description: `Your journal entry for ${selectedGoal?.name} has been saved.`,
      });
    }
  };

  const handleSummarize = async () => {
    if (!selectedGoal || !entryContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cannot Summarize',
        description: 'Please select a goal and write an entry before summarizing.',
      });
      return;
    }

    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeDailyProgress({
        journalEntries: { [selectedGoal.name]: entryContent },
      });
      setSummary(result.summary[selectedGoal.name]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate summary. Please try again.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Image src="https://placehold.co/400x300.png" alt="Welcome to Apo Navigator" width={400} height={300} className="rounded-lg mb-8" data-ai-hint="welcome illustration" />
        <h1 className="text-3xl font-bold mb-2 font-headline">Welcome to Apo Navigator</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start by creating your first goal area. Define what matters to you and begin your journey of reflection and growth.
        </p>
        <Button onClick={() => window.location.href = '/goals'}>Create Your First Goal</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-3">
                {GoalIcon && <GoalIcon className="w-8 h-8 text-primary" />}
                {selectedGoal?.name || 'Select a Goal'}
              </CardTitle>
              <CardDescription>
                Your daily journal entry. What progress did you make today?
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write about your progress, thoughts, and feelings for today..."
            className="min-h-[300px] text-base"
            value={entryContent}
            onChange={(e) => setEntryContent(e.target.value)}
            disabled={!selectedGoalId}
          />

          {summary && (
            <Card className="mt-4 border-accent bg-accent/10">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-accent-foreground/90">
                  <Bot className="w-5 h-5" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-foreground/80">{summary}</p>
              </CardContent>
            </Card>
          )}

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleSummarize} disabled={isSummarizing || !entryContent.trim()}>
            {isSummarizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bot className="mr-2 h-4 w-4" />
            )}
            {isSummarizing ? 'Summarizing...' : 'AI Summary'}
          </Button>
          <Button onClick={handleSave} disabled={!selectedGoalId}>Save Entry</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function JournalPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JournalPage />
    </Suspense>
  )
}
