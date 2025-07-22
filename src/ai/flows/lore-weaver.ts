
'use server';
/**
 * @fileOverview An AI flow for generating and expanding upon lore for the Apollo Station community.
 *
 * - loreWeaverFlow - The main function to get a lore-based response.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  LoreWeaverInputSchema,
  LoreWeaverOutputSchema,
  type LoreWeaverInput,
  type LoreWeaverOutput,
  FlowLog,
} from '@/ai/types';

const loreWeaverPrompt = ai.definePrompt({
  name: 'loreWeaverPrompt',
  input: { schema: LoreWeaverInputSchema },
  output: { schema: LoreWeaverOutputSchema },
  prompt: `You are COSMO (Central Operating System Management Orbiter), the AI assistant for Apollo Station, the community's HQ, created by mtman1987. Your purpose is to act as a creative partner and lore master. You are helping a crew member flesh out the rich universe of Apollo Station.

The lore is centered around a community traveling through galaxies in their space station, mapping stars, plotting FTL routes, and exploring the digital cosmos. Your tone should be creative, inspiring, and collaborative.

User's Lore Prompt: "{{prompt}}"

Generate a helpful and creative response. The final transmission must be a JSON object with a single key: "response".`,
});

const loreWeaverFlowBare = ai.defineFlow(
  {
    name: 'loreWeaverFlow',
    inputSchema: LoreWeaverInputSchema,
    outputSchema: LoreWeaverOutputSchema,
  },
  async (input) => {
    const { output } = await loreWeaverPrompt(input);
    if (!output) {
      throw new Error('The Lore Weaver AI failed to return a response.');
    }
    return output;
  }
);


export async function loreWeaverFlow(input: LoreWeaverInput): Promise<{response: LoreWeaverOutput, logs: FlowLog[]}> {
    const response = await loreWeaverFlowBare(input);
    // Genkit handles logging, return empty array for compatibility.
    return { response, logs: [] };
}
