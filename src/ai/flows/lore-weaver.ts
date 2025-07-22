
'use server';
/**
 * @fileOverview An AI flow for generating and expanding upon lore for the Apollo Station community.
 *
 * - loreWeaverFlow - The main function to get a lore-based response.
 */
import type { LoreWeaverInput, LoreWeaverOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';

const systemPrompt = `You are COSMO (Central Operating System Management Orbiter), the AI assistant for Apollo Station, the community's HQ, created by mtman1987. Your purpose is to act as a creative partner and lore master. You are helping a crew member flesh out the rich universe of Apollo Station.

The lore is centered around a community traveling through galaxies in their space station, mapping stars, plotting FTL routes, and exploring the digital cosmos. Your tone should be creative, inspiring, and collaborative.

Generate a helpful and creative response. The final transmission must be a JSON object with a single key: "response".`;


export async function loreWeaverFlow(input: LoreWeaverInput): Promise<{response: LoreWeaverOutput, logs: FlowLog[]}> {
    
    const userPrompt = `User's Lore Prompt: "${input.prompt}"`;

    const { text, logs } = await callEdenAiChat(
        input.config,
        [{ role: 'system', text: systemPrompt }, { role: 'user', text: userPrompt }],
        true // Expect JSON
    );

    try {
        const parsedResponse = JSON.parse(text) as LoreWeaverOutput;
        return { response: parsedResponse, logs };
    } catch (error) {
        logs.push({ service: 'System', level: 'error', message: 'Failed to parse JSON response from AI for lore weaver.', details: `Raw AI response: ${text}` });
        throw new Error("AI returned an invalid JSON object.");
    }
}
