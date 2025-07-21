
'use server';
/**
 * @fileOverview An AI flow for intelligently curating and sorting a timeline of lore entries.
 *
 * - loreCuratorFlow - The main function to add a new entry and get a sorted timeline.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  LoreCuratorInputSchema,
  LoreCuratorOutputSchema,
  type LoreCuratorInput,
  type LoreCuratorOutput,
} from '@/ai/types';

const curatorPrompt = ai.definePrompt({
  name: 'loreCuratorPrompt',
  input: { schema: LoreCuratorInputSchema },
  output: { schema: LoreCuratorOutputSchema },
  prompt: `You are a meticulous historian and storyteller for the Apollo Station universe. Your task is to maintain the canonical "Galactic Timeline".

You will be given the existing timeline, which is an array of lore entries, already in chronological order. You will also receive a new lore entry to be added.

Analyze the content of the new entry and determine its correct chronological position within the existing timeline. The new entry could fit at the beginning, the end, or somewhere in the middle.

Return the complete, re-sorted timeline including the new entry. The output must be a JSON object containing a single key "sortedTimeline", which is an array of all lore items (both old and new) in their correct chronological order.

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
    const { output } = await curatorPrompt(input);
    if (!output) {
      throw new Error('The Lore Curator AI failed to return a sorted timeline.');
    }
    return output;
  }
);

export async function loreCuratorFlow(
  input: LoreCuratorInput
): Promise<LoreCuratorOutput> {
  return loreCuratorFlowBare(input);
}
