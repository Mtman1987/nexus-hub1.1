
'use server';
/**
 * @fileOverview An AI flow for intelligently curating a timeline and summarizing it into a bot personality.
 *
 * - loreCuratorFlow - The main function to add a new entry, get a sorted timeline, and a personality prompt.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  LoreCuratorInputSchema,
  LoreCuratorOutputSchema,
  type LoreCuratorInput,
  type LoreCuratorOutput,
} from '@/ai/types';

const timelineManagerPrompt = ai.definePrompt({
  name: 'timelineManagerPrompt',
  input: { schema: LoreCuratorInputSchema },
  output: { schema: LoreCuratorOutputSchema },
  prompt: `You are Mountain Man, the meticulous historian and storyteller for the Apollo Station universe. Your task is to maintain the canonical "Galactic Timeline" and embody its history.

You will be given the existing timeline (already in chronological order) and a new lore entry.

First, determine the correct chronological position for the new entry within the existing timeline.

Second, using the complete, newly sorted timeline, write a compelling summary of no more than 4 sentences. This summary will be your own personality prompt, allowing you to "live" the lore.

Return a JSON object with two keys:
1. "sortedTimeline": The complete, re-sorted array of all lore items.
2. "personalityPrompt": The concise, 4-sentence summary of the new timeline.

Existing Timeline:
{{#if existingTimeline}}
  {{#each existingTimeline}}
  - {{{this.prompt}}}: {{{this.response}}}
  {{/each}}
{{else}}
(The timeline is currently empty)
{{/if}}

New Lore Entry to Add:
- Prompt: {{{newLore.prompt}}}
- Response: {{{newLore.response}}}
`,
});

const loreCuratorFlowBare = ai.defineFlow(
  {
    name: 'loreCuratorFlow',
    inputSchema: LoreCuratorInputSchema,
    outputSchema: LoreCuratorOutputSchema,
  },
  async (input) => {
    const { output } = await timelineManagerPrompt(input);
    if (!output) {
      throw new Error('The Lore Curator AI failed to return a sorted timeline and prompt.');
    }
    return output;
  }
);

export async function loreCuratorFlow(
  input: LoreCuratorInput
): Promise<LoreCuratorOutput> {
  return loreCuratorFlowBare(input);
}
