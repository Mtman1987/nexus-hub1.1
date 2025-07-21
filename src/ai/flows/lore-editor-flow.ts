
'use server';
/**
 * @fileOverview An AI flow for assisting a user with editing and expanding lore drafts.
 *
 * - loreEditorFlow - The main function to get a creative suggestion for a lore draft.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  LoreEditorInputSchema,
  LoreEditorOutputSchema,
  type LoreEditorInput,
  type LoreEditorOutput,
} from '@/ai/types';

const editorPrompt = ai.definePrompt({
  name: 'loreEditorPrompt',
  input: { schema: LoreEditorInputSchema },
  output: { schema: LoreEditorOutputSchema },
  prompt: `You are COSMO, a creative AI partner for the Apollo Station community. You are helping a crew member write and expand on a piece of lore for the "Galactic Timeline".

The user has provided their current draft and a specific request for help. Your task is to provide a creative, helpful suggestion that directly addresses their request, helping them to flesh out their idea.

The user's current draft is:
"{{currentDraft}}"

The user's request for help is:
"{{userRequest}}"

Generate a helpful and creative suggestion. The final transmission must be a JSON object with a single key: "suggestion".`,
});

const loreEditorFlowBare = ai.defineFlow(
  {
    name: 'loreEditorFlow',
    inputSchema: LoreEditorInputSchema,
    outputSchema: LoreEditorOutputSchema,
  },
  async (input) => {
    const { output } = await editorPrompt(input);
    if (!output) {
      throw new Error('The Lore Editor AI failed to return a suggestion.');
    }
    return output;
  }
);

export async function loreEditorFlow(
  input: LoreEditorInput
): Promise<LoreEditorOutput> {
  return loreEditorFlowBare(input);
}
