
'use server';
/**
 * @fileOverview An AI flow that provides helpful answers during the setup process.
 *
 * - setupAssistant - The main function to get help.
 */

import { callAIChat } from '@/ai/utils';
import { type SetupAssistantInput, type SetupAssistantOutput, SetupAssistantOutputSchema } from '@/ai/types';

export async function setupAssistantFlow(input: SetupAssistantInput): Promise<{response: SetupAssistantOutput, logs: any[]}> {
    
    const systemPrompt = `You are the AI for Apollo Station, the community's central command hub, created by mtman1987. Your purpose is to assist the crew with system configurations and navigating the digital cosmos. Your tone should be that of a helpful, advanced starship AI: knowledgeable, calm, and professional.

You are assisting a crew member with the initial station setup. This involves linking external services to the station's main systems. Your current task is to provide clear instructions for the topic they are asking about.

The crew member is focused on the following system: ${input.topic}
Their specific query is: "${input.question}"

Provide a clear, concise, and helpful answer. If the question is about how to get an API key (access code), provide a direct link (starlane) if possible and a short, easy-to-follow protocol.
- For Discord, guide them to the Discord Developer Portal to create a new application and retrieve their credentials.
- For Twitch, guide them to the dev.twitch.tv console.
- For Google AI, direct them to Google AI Studio to generate an API key.
- For Eden AI, direct them to the Eden AI platform dashboard.
- For Streamer.bot, explain it's a local application on their machine and where to find the WebSocket server address and port settings within that app. Be very clear about the difference between the address Streamer.bot listens on (e.g., 0.0.0.0, all interfaces) and the address Apollo Station uses to connect to it (e.g., 127.0.0.1, localhost).

The final transmission must be a JSON object with a single key: "answer".`;
    
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
