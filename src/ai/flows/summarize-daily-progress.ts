'use server';
/**
 * @fileOverview Summarizes the daily progress in each goal area from journal entries.
 *
 * - summarizeDailyProgress - A function that summarizes daily progress.
 * - SummarizeDailyProgressInput - The input type for the summarizeDailyProgress function.
 * - SummarizeDailyProgressOutput - The return type for the summarizeDailyProgress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDailyProgressInputSchema = z.object({
  journalEntries: z.record(z.string(), z.string()).describe('A map of goal areas to journal entries for the day.'),
});
export type SummarizeDailyProgressInput = z.infer<typeof SummarizeDailyProgressInputSchema>;

const SummarizeDailyProgressOutputSchema = z.object({
  summary: z.record(z.string(), z.string()).describe('A map of goal areas to summaries of progress for the day.'),
  progress: z.string().describe('A short, one-sentence summary of what you have generated.')
});
export type SummarizeDailyProgressOutput = z.infer<typeof SummarizeDailyProgressOutputSchema>;

export async function summarizeDailyProgress(input: SummarizeDailyProgressInput): Promise<SummarizeDailyProgressOutput> {
  return summarizeDailyProgressFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDailyProgressPrompt',
  input: {schema: SummarizeDailyProgressInputSchema},
  output: {schema: SummarizeDailyProgressOutputSchema},
  prompt: `You are an AI assistant that summarizes daily journal entries for different goal areas.

  For each goal area, provide a concise summary of the progress made, key achievements, and areas needing more focus.

  Goal Areas and Journal Entries:
  {{#each journalEntries}}
  {{@key}}: {{{this}}}
  {{/each}}

  Summary (as a JSON object with goal area keys and summary values):`,
});

const summarizeDailyProgressFlow = ai.defineFlow(
  {
    name: 'summarizeDailyProgressFlow',
    inputSchema: SummarizeDailyProgressInputSchema,
    outputSchema: SummarizeDailyProgressOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output!,
      progress: 'Generated a summary of daily journal entries, providing insights for each goal area.',
    };
  }
);
