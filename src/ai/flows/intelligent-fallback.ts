
'use server';
/**
 * @fileOverview An AI flow for recommending the best provider for a given task.
 *
 * - intelligentFallbackFlow - The main function to get a recommendation.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  IntelligentFallbackInputSchema,
  IntelligentFallbackOutputSchema,
  type IntelligentFallbackInput,
  type IntelligentFallbackOutput,
} from '@/ai/types';

const intelligentFallbackPrompt = ai.definePrompt({
  name: 'intelligentFallbackPrompt',
  input: { schema: IntelligentFallbackInputSchema },
  output: { schema: IntelligentFallbackOutputSchema },
  prompt: `You are an expert AI routing system. Your job is to recommend the best AI provider for a specific task based on the user's prompt and goal.

You have been configured with the following providers: {{#each config.providerStatus}}{{this}}{{/each}}.

User's Goal: "{{goal}}"
User's Prompt: "{{prompt}}"

Analyze the prompt and goal. Based on the available providers, recommend the single best one for this task. Your recommendation should be based on the general strengths of the providers (e.g., Google Gemini for general knowledge and speed, Groq for fastest response, EdenAI for access to high-end models like Claude/GPT-4 for creative and complex writing). Output your response as a JSON object with two keys: "recommendation" and "reasoning".`,
});


const intelligentFallbackFlowBare = ai.defineFlow(
  {
    name: 'intelligentFallbackFlow',
    inputSchema: IntelligentFallbackInputSchema,
    outputSchema: IntelligentFallbackOutputSchema,
  },
  async (input) => {
    // Filter to only enabled providers for the prompt
    const enabledProviders = Object.entries(input.config.providerStatus || {})
        .filter(([, status]) => status === 'enabled')
        .map(([key]) => key);

    const { output } = await intelligentFallbackPrompt({
        ...input,
        config: {
            ...input.config,
            providerStatus: enabledProviders
        }
    });

    if (!output) {
      throw new Error('The AI failed to return a recommendation.');
    }
    return output;
  }
);


export async function intelligentFallbackFlow(
  input: IntelligentFallbackInput
): Promise<{response: IntelligentFallbackOutput, logs: any[]}> {
  // Genkit logs are handled automatically, so we return an empty array for compatibility.
  const response = await intelligentFallbackFlowBare(input);
  return { response, logs: [] };
}
