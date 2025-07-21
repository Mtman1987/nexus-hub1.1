'use server';

/**
 * @fileOverview Generates starting prompts for each life area to inspire new users.
 *
 * - generateStartingPrompts - A function that generates starting prompts for a given list of life areas.
 * - GenerateStartingPromptsInput - The input type for the generateStartingPrompts function.
 * - GenerateStartingPromptsOutput - The return type for the generateStartingPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStartingPromptsInputSchema = z.object({
  lifeAreas: z
    .array(z.string())
    .describe('A list of life areas for which to generate starting prompts.'),
});
export type GenerateStartingPromptsInput = z.infer<
  typeof GenerateStartingPromptsInputSchema
>;

const GenerateStartingPromptsOutputSchema = z.record(
  z.string(),
  z.array(z.string())
);
export type GenerateStartingPromptsOutput = z.infer<
  typeof GenerateStartingPromptsOutputSchema
>;

export async function generateStartingPrompts(
  input: GenerateStartingPromptsInput
): Promise<GenerateStartingPromptsOutput> {
  return generateStartingPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStartingPromptsPrompt',
  input: {schema: GenerateStartingPromptsInputSchema},
  output: {schema: GenerateStartingPromptsOutputSchema},
  prompt: `You are an AI assistant designed to inspire users to write in their journals.

  Given a list of life areas, generate three starting prompts for each area. These prompts should be open-ended and encourage reflection and goal-setting.

  Return the prompts as a JSON object where the keys are the life areas and the values are arrays of three strings (the prompts).

  Life Areas: {{{lifeAreas}}}
  `,
});

const generateStartingPromptsFlow = ai.defineFlow(
  {
    name: 'generateStartingPromptsFlow',
    inputSchema: GenerateStartingPromptsInputSchema,
    outputSchema: GenerateStartingPromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
