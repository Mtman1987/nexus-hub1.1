
'use server';
/**
 * @fileOverview An AI flow for assisting a user with editing and expanding lore drafts.
 *
 * - loreEditorFlow - The main function to get a creative suggestion for a lore draft.
 */
import type { LoreEditorInput, LoreEditorOutput } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';
import { AppConfig } from '@/ai/types';

const systemPrompt = `You are COSMO, a creative AI partner for the Apollo Station community. You are helping a crew member write and expand on a piece of lore for the "Galactic Timeline".

The user has provided their current draft and a specific request for help. Your task is to provide a creative, helpful suggestion that directly addresses their request, helping them to flesh out their idea.

IMPORTANT: Generate a helpful and creative suggestion. The final transmission must be a valid JSON object with a single key: "suggestion". Do not add any other text or formatting.`;


export async function loreEditorFlow(input: LoreEditorInput): Promise<LoreEditorOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };

    const userPrompt = `The user's current draft is:\n"${input.currentDraft}"\n\nThe user's request for help is:\n"${input.userRequest}"`;
    
    const { text, logs } = await callEdenAiChat(config, 
        [
            { role: 'user', text: systemPrompt },
            { role: 'assistant', text: 'Acknowledged. I will provide my suggestion in the requested JSON format.' },
            { role: 'user', text: userPrompt }
        ], 
        true);
    
    // The main service function will handle logging
    
    const parsed = JSON.parse(text);
    return parsed;
}
