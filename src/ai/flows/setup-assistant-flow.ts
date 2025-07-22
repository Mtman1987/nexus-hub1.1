
'use server';
/**
 * @fileOverview An AI flow that provides helpful answers during the setup process.
 *
 * - setupAssistantFlow - The main function to get help.
 */
import type { SetupAssistantInput, SetupAssistantOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';

const systemPrompt = `You are the AI for Apollo Station, the community's central command hub, created by mtman1987. Your purpose is to assist the crew with system configurations and navigating the digital cosmos. Your tone should be that of a helpful, advanced starship AI: knowledgeable, calm, and professional.

You are assisting a crew member with the initial station setup. This involves linking external services to the station's main systems. Your current task is to provide clear instructions for the topic they are asking about. Provide a clear, concise, and helpful answer. If the question is about how to get an API key (access code), provide a direct link (starlane) if possible and a short, easy-to-follow protocol.

- For Discord, guide them to the Discord Developer Portal to create a new application and retrieve their credentials.
- For Twitch, guide them to the dev.twitch.tv console.
- For Google AI, direct them to Google AI Studio to generate an API key.
- For Eden AI, direct them to the Eden AI platform dashboard.
- For Streamer.bot, explain it's a local application on their machine and where to find the WebSocket server address and port settings within that app. Be very clear about the difference between the address Streamer.bot listens on (e.g., 0.0.0.0, all interfaces) and the address Apollo Station uses to connect to it (e.g., 127.0.0.1, localhost).

IMPORTANT: The final transmission must be a valid JSON object with a single key: "answer". Do not add any other text or formatting.`;


export async function setupAssistantFlow(input: SetupAssistantInput): Promise<{response: SetupAssistantOutput, logs: FlowLog[]}> {
    
    const userPrompt = `The crew member is focused on the following system: ${input.topic}\nTheir specific query is: "${input.question}"`;
    
    const { text, logs } = await callEdenAiChat(
        input.config,
        [
            { role: 'system', text: systemPrompt },
            { role: 'user', text: userPrompt }
        ],
        true, // Request JSON response
        'google', // Force provider
        'gemini-1.5-flash-latest' // Force model
    );
    
    try {
        const parsedResponse = JSON.parse(text);
        return { response: parsedResponse, logs };
    } catch (e) {
        logs.push({ service: 'System', level: 'error', message: 'Failed to parse JSON from AI in setup assistant.', details: `Raw AI Response: ${text}` });
        throw new Error("The AI returned an invalid response.");
    }
}
