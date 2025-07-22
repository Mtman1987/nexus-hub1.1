
'use server';
/**
 * @fileOverview An AI flow for recommending the best provider for a given task.
 *
 * - intelligentFallbackFlow - The main function to get a recommendation.
 */
import type { IntelligentFallbackInput, IntelligentFallbackOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';

const getSystemPrompt = (providers: string[]) => `You are an expert AI routing system. Your job is to recommend the best AI provider for a specific task based on the user's prompt and goal.

You have been configured with the following providers: ${providers.join(', ')}.

Analyze the prompt and goal. Based on the available providers, recommend the single best one for this task. Your recommendation should be based on the general strengths of the providers (e.g., Google Gemini for general knowledge and speed, Groq for fastest response, EdenAI for access to high-end models like Claude/GPT-4 for creative and complex writing). Output your response as a JSON object with two keys: "recommendation" and "reasoning".`;


export async function intelligentFallbackFlow(
  input: IntelligentFallbackInput
): Promise<{response: IntelligentFallbackOutput, logs: FlowLog[]}> {
    
    // Filter to only enabled providers for the prompt
    const enabledProviders = Object.entries(input.config.providerStatus || {})
        .filter(([, status]) => status === 'enabled')
        .map(([key]) => key);

    const systemPrompt = getSystemPrompt(enabledProviders);
    const userPrompt = `User's Goal: "${input.goal}"\nUser's Prompt: "${input.prompt}"`;

    const { text, logs } = await callEdenAiChat(
        input.config, 
        [{ role: 'system', text: systemPrompt }, { role: 'user', text: userPrompt }],
        true // Expect a JSON response
    );
    
    try {
        const parsedResponse = JSON.parse(text) as IntelligentFallbackOutput;
        return { response: parsedResponse, logs };
    } catch (error) {
        logs.push({ service: 'System', level: 'error', message: 'Failed to parse JSON response from AI for fallback.', details: `Raw AI response: ${text}` });
        throw new Error("AI returned an invalid JSON object.");
    }
}
