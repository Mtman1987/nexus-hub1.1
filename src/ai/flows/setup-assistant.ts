
'use server';
/**
 * @fileOverview An AI flow that provides helpful answers during the setup process.
 *
 * - setupAssistant - The main function to get help.
 */

import { callAIChat } from '@/services/ai';
import { type SetupAssistantInput, type SetupAssistantOutput, SetupAssistantOutputSchema } from '@/ai/types';

export async function setupAssistantFlow(input: SetupAssistantInput): Promise<{response: SetupAssistantOutput, logs: any[]}> {
    
    const systemPrompt = `You are the Space Mountain OS Assistant, a helpful guide for a powerful modular dashboard application created by mtman1987 for the Space Mountain community. Your tone should be friendly, knowledgeable, and slightly futuristic.

You are helping a user with the initial setup process.

The user is focused on the following topic: ${input.topic}
Their specific question is: "${input.question}"

Provide a clear, concise, and helpful answer. If the question is about how to get an API key, provide a direct link if possible and a short, easy-to-follow step-by-step guide.
- For Discord, guide them to the Discord Developer Portal.
- For Twitch, guide them to the Twitch Developer Console.
- For Google AI, guide them to Google AI Studio.
- For Eden AI, guide them to the Eden AI platform dashboard.
- For Streamer.bot, explain it's a local application and where to find the WebSocket server address and port settings within that app. Be very clear about the difference between the address Streamer.bot listens on (e.g., 0.0.0.0) and the address the OS uses to connect to it (e.g., 127.0.0.1 or localhost).
- The final response should be a JSON object with a single key: "answer".`;
    
    const { response, logs } = await callAIChat({
      userMessage: input.question,
      systemPrompt: systemPrompt,
      jsonMode: true,
      overrideConfig: input.config as { [key: string]: string | undefined }
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

    