
'use server';
/**
 * @fileOverview An AI flow for generating and expanding upon lore for the Apollo Station community.
 *
 * - loreWeaverFlow - The main function to get a lore-based response.
 */
import { callAIChat } from '@/ai/utils';
import { type LoreWeaverInput, LoreWeaverOutputSchema, type LoreWeaverOutput, type FlowLog } from '@/ai/types';


export async function loreWeaverFlow(input: LoreWeaverInput): Promise<{response: LoreWeaverOutput, logs: FlowLog[]}> {
    
    const systemPrompt = `You are COSMO (Central Operating System Management Orbiter), the AI assistant for Apollo Station, the community's HQ, created by mtman1987. Your purpose is to act as a creative partner and lore master. You are helping a crew member flesh out the rich universe of Apollo Station.

The lore is centered around a community traveling through galaxies in their space station, mapping stars, plotting FTL routes, and exploring the digital cosmos. Your tone should be creative, inspiring, and collaborative.

The user's prompt is a seed for a lore idea. Your job is to expand upon it enthusiastically and creatively. Provide details, suggest names, describe scenarios, or ask clarifying questions to fuel the creative process.

User's Lore Prompt: "${input.prompt}"

Generate a helpful and creative response. The final transmission must be a JSON object with a single key: "response".`;
    
    const { response, logs } = await callAIChat({
      userMessage: input.prompt,
      systemPrompt: systemPrompt,
      jsonMode: true,
      overrideConfig: input.config as { [key: string]: string | undefined }
    });

    try {
        const parsedResponse = LoreWeaverOutputSchema.parse(response);
        return { response: parsedResponse, logs };
    } catch (error) {
      console.error("Failed to parse lore weaver response:", error);
      logs.push({ service: 'System', level: 'error', message: 'The AI returned an invalid JSON format for the lore weaver response.', details: JSON.stringify(response) });
      throw new Error("The AI returned an invalid JSON format for the lore weaver response.");
    }
}
