
'use server';
/**
 * @fileOverview An AI flow for recommending the best provider for a given task.
 *
 * - intelligentFallback - The main function to get a recommendation.
 */
import { callAIChat } from '@/ai/utils';
import { IntelligentFallbackOutputSchema, type IntelligentFallbackInput, type IntelligentFallbackOutput } from '@/ai/types';

export async function intelligentFallbackFlow(input: IntelligentFallbackInput): Promise<{response: IntelligentFallbackOutput, logs: any[]}> {
    
    const systemPrompt = `You are an expert AI routing system. Your job is to recommend the best AI provider for a specific task based on the user's prompt and goal.

You have been configured with the following providers: ${Object.entries(input.config.providerStatus || {}).filter(([, status]) => status === 'enabled').map(([key]) => key).join(', ')}.

User's Goal: "${input.goal}"
User's Prompt: "${input.prompt}"

Analyze the prompt and goal. Based on the available providers, recommend the single best one for this task. Your recommendation should be based on the general strengths of the providers (e.g., Google Gemini for general knowledge and speed, Groq for fastest response, EdenAI for access to high-end models like Claude/GPT-4 for creative and complex writing). Output your response as a JSON object with two keys: "recommendation" and "reasoning".`;
    
    const { response, logs } = await callAIChat({
        userMessage: systemPrompt,
        jsonMode: true,
        overrideConfig: input.config as { [key: string]: string | undefined }
    });
    
    try {
        const parsedResponse = IntelligentFallbackOutputSchema.parse(response);
        return { response: parsedResponse, logs };
    } catch (error) {
        console.error("Failed to parse intelligent fallback response:", error);
        logs.push({ service: 'System', level: 'error', message: 'The AI returned an invalid JSON format for the fallback recommendation.', details: JSON.stringify(response) });
        throw new Error("The AI returned an invalid JSON format for the fallback recommendation.");
    }
}
