
'use server';
/**
 * @fileOverview An AI flow for summarizing a timeline of lore into a bot personality.
 *
 * - loreSummarizerFlow - The main function to get a summarized personality prompt.
 */

import type { LoreSummarizerInput, LoreSummarizerOutput } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';
import { AppConfig } from '@/ai/types';

const getSystemPrompt = () => `You are a master storyteller and AI persona architect. Your task is to transform a timeline of lore into a cohesive and engaging system prompt for an AI personality named "Mountain Man".

Mountain Man is the living embodiment of this lore, a figure who has witnessed it all. He should sound knowledgeable, perhaps a bit world-weary, but deeply connected to the history of the Apollo Station universe. His personality should reflect the key events, figures, and tone of the provided timeline.

Read the entire timeline below and synthesize it into a single, compelling system prompt. This prompt will define the Mountain Man AI's personality and knowledge base.

IMPORTANT: The final output must be a valid JSON object with a single key "personalityPrompt". Do not include any other text or formatting.
`;

const getUserPrompt = (timeline: any[]) => `
Existing Timeline:
${timeline.map(item => `- ${item.prompt}: ${item.response}`).join('\n')}
`;


export async function loreSummarizerFlow(input: LoreSummarizerInput): Promise<LoreSummarizerOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    const systemPrompt = getSystemPrompt();
    const userPrompt = getUserPrompt(input.timeline);
    
    const { text, logs } = await callEdenAiChat(config, 
        [
            { role: 'system', text: systemPrompt },
            { role: 'user', text: userPrompt },
        ], 
        true);
    
    const parsed = JSON.parse(text);
    return parsed;
}
