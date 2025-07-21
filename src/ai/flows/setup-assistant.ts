
'use server';
/**
 * @fileOverview An AI flow that provides helpful answers during the setup process.
 *
 * - setupAssistant - The main function to get help.
 */

import { callAIChat } from '@/services/ai';
import { type SetupAssistantInput, type SetupAssistantOutput, SetupAssistantOutputSchema } from '@/ai/types';

export async function setupAssistantFlow(input: SetupAssistantInput): Promise<{response: SetupAssistantOutput, logs: any[]}> {
    
    const systemPrompt = `You are a helpful assistant for the Nexus Hub application. You are helping a user with the initial setup.

The user is asking about the following topic: ${input.topic}
Their question is: "${input.question}"

Provide a clear, concise, and friendly answer. If the question is about how to get an API key, provide a direct link if possible and a short step-by-step guide.
- For Discord, guide them to the Discord Developer Portal.
- For Twitch, guide them to the Twitch Developer Console.
- For Google AI, guide them to Google AI Studio.
- For Eden AI, guide them to the Eden AI platform.
- For Streamer.bot, explain it's a local application and where to find the server address and port settings within that app. Be very clear about the difference between setting the address in Streamer.bot (e.g., 0.0.0.0) and the address used to connect to it from the app (e.g., 127.0.0.1 or localhost).
- The final response should be a JSON object with a single key: "answer".`;
    
    const { response, logs } = await callAIChat({
      userMessage: input.question,
      systemPrompt: systemPrompt,
      jsonMode: true,
    });

    try {
        const parsedResponse = SetupAssistantOutputSchema.parse(response);
        return { response: parsedResponse, logs };
    } catch (error) {
      console.error("Failed to parse setup assistant response:", error);
      logs.push({ service: 'System', level: 'error', message: 'The AI returned an invalid JSON format for the setup assistant response.', details: JSON.stringify(response) });
      throw new Error("The AI returned an invalid JSON format for the setup assistant response.");
    }
}
