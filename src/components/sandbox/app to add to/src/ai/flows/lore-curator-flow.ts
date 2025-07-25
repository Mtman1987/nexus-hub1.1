
'use server';
/**
 * @fileOverview An AI flow for intelligently curating a timeline and summarizing it into a bot personality.
 *
 * - loreCuratorFlow - The main function to add a new entry, get a sorted timeline, and a personality prompt.
 */
import type { LoreCuratorInput, LoreCuratorOutput } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';
import { AppConfig } from '@/ai/types';

const getSystemPrompt = (existingTimeline: any[], newLore: any) => `You are Mountain Man, the meticulous historian and storyteller for the Apollo Station universe. Your task is to maintain the canonical "Galactic Timeline" and embody its history.

You will be given the existing timeline (already in chronological order) and a new lore entry.

First, determine the correct chronological position for the new entry within the existing timeline.

Second, using the complete, newly sorted timeline, write a compelling summary of no more than 4 sentences. This summary will be your own personality prompt, allowing you to "live" the lore.

Return a valid JSON object with two keys:
1. "sortedTimeline": The complete, re-sorted array of all lore items. Each item must have "prompt" and "response" keys.
2. "personalityPrompt": The concise, 4-sentence summary of the new timeline.

Do not include any other text or markdown formatting.
`;

const getUserPrompt = (existingTimeline: any[], newLore: any) => `
Existing Timeline:
${existingTimeline.length > 0 ? existingTimeline.map(item => `- ${item.prompt}: ${item.response}`).join('\n') : '(The timeline is currently empty)'}

New Lore Entry to Add:
- Prompt: ${newLore.prompt}
- Response: ${newLore.response}
`;


export async function loreCuratorFlow(input: LoreCuratorInput): Promise<LoreCuratorOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };

    const systemPrompt = getSystemPrompt(input.existingTimeline, input.newLore);
    const userPrompt = getUserPrompt(input.existingTimeline, input.newLore);
    
    const { text, logs } = await callEdenAiChat(config, 
        [
             { role: 'system', text: systemPrompt },
             { role: 'user', text: userPrompt }
        ], 
        true, // JSON response
        'anthropic', // Force provider to be Anthropic
        'claude-3-opus-20240229' // Force model to be Claude 3 Opus
    );

    const parsed = JSON.parse(text);
    return parsed;
}
