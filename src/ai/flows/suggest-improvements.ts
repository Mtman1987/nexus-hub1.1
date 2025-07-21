// use server'
'use server';

/**
 * @fileOverview Provides AI-driven suggestions for improvements based on journal entries.
 *
 * - suggestImprovements -  A function that takes journal entries and returns suggested actions or improvements.
 * - SuggestImprovementsInput - The input type for the suggestImprovements function.
 * - SuggestImprovementsOutput - The return type for the suggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImprovementsInputSchema = z.object({
  journalEntries: z.array(
    z.object({
      date: z.string().describe('The date of the journal entry (ISO format).'),
      goalArea: z.string().describe('The goal area the entry pertains to (e.g., Career, Health).'),
      entryText: z.string().describe('The text content of the journal entry.'),
    })
  ).describe('An array of journal entries to analyze.'),
});

export type SuggestImprovementsInput = z.infer<typeof SuggestImprovementsInputSchema>;

const SuggestImprovementsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      goalArea: z.string().describe('The goal area the suggestion applies to.'),
      suggestionText: z.string().describe('A specific, actionable suggestion for improvement.'),
    })
  ).describe('An array of suggested actions or improvements, categorized by goal area.'),
});

export type SuggestImprovementsOutput = z.infer<typeof SuggestImprovementsOutputSchema>;

export async function suggestImprovements(input: SuggestImprovementsInput): Promise<SuggestImprovementsOutput> {
  return suggestImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImprovementsPrompt',
  input: {schema: SuggestImprovementsInputSchema},
  output: {schema: SuggestImprovementsOutputSchema},
  prompt: `You are an AI assistant that analyzes a user's journal entries and provides actionable suggestions for improvement in different goal areas.

  Analyze the following journal entries to identify trends, patterns, and potential areas for improvement. Provide specific and actionable suggestions for each goal area, focusing on what the user can do to make progress toward their goals.  Focus on providing only the most impactful advice.

Journal Entries:
{{#each journalEntries}}
  Date: {{date}}
  Goal Area: {{goalArea}}
  Entry: {{entryText}}
{{/each}}

Suggestions (Goal Area and Suggestion Text):
`,
});

const suggestImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestImprovementsFlow',
    inputSchema: SuggestImprovementsInputSchema,
    outputSchema: SuggestImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
