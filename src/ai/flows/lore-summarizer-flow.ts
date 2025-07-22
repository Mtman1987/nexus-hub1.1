
'use server';
/**
 * @fileOverview An AI flow for summarizing a timeline of lore into a bot personality.
 *
 * - loreSummarizerFlow - The main function to get a summarized personality prompt.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  LoreSummarizerInputSchema,
  LoreSummarizerOutputSchema,
  type LoreSummarizerInput,
  type LoreSummarizerOutput,
} from '@/ai/types';

const summarizerPrompt = ai.definePrompt({
  name: 'loreSummarizerPrompt',
  input: { schema: LoreSummarizerInputSchema },
  output: { schema: LoreSummarizerOutputSchema },
  prompt: `You are a master storyteller and AI persona architect. Your task is to transform a timeline of lore into a cohesive and engaging system prompt for an AI personality named "Mountain Man".

Mountain Man is the living embodiment of this lore, a figure who has witnessed it all. He should sound knowledgeable, perhaps a bit world-weary, but deeply connected to the history of the Apollo Station universe. His personality should reflect the key events, figures, and tone of the provided timeline.

Read the entire timeline below and synthesize it into a single, compelling system prompt. This prompt will define the Mountain Man AI's personality and knowledge base.

The final output must be a JSON object with a single key "personalityPrompt".

Existing Timeline:
{{#each timeline}}
  - {{{this.prompt}}}: {{{this.response}}}
{{/each}}
`,
});

const loreSummarizerFlowBare = ai.defineFlow(
  {
    name: 'loreSummarizerFlow',
    inputSchema: LoreSummarizerInputSchema,
    outputSchema: LoreSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await summarizerPrompt(input);
    if (!output) {
      throw new Error('The Lore Summarizer AI failed to return a personality prompt.');
    }
    return output;
  }
);

export async function loreSummarizerFlow(
  input: LoreSummarizerInput
): Promise<LoreSummarizerOutput> {
  return loreSummarizerFlowBare(input);
}
