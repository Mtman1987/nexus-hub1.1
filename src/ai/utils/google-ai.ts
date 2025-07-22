
'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { FlowLog, AppConfig } from "../types";

type GoogleAiChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

/**
 * A helper function to make chat completion calls to the Google AI API.
 */
export async function callGoogleAiChat(
    config: AppConfig,
    history: GoogleAiChatMessage[],
    prompt: string,
    systemInstruction?: string,
): Promise<{ text: string, logs: FlowLog[] }> {

    const logs: FlowLog[] = [];
    if (!config.googleApiKey) {
        throw new Error("Google AI API key is not configured.");
    }

    const genAI = new GoogleGenerativeAI(config.googleApiKey);
    const modelName = config.googleModelName || 'gemini-1.5-flash-latest';

    const model = genAI.getGenerativeModel({
        model: modelName,
        ...(systemInstruction && { systemInstruction }),
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ]
    });

    try {
        logs.push({ service: 'Google AI', level: 'info', message: `Calling Google AI chat with model: ${modelName}`, details: `Prompt: ${prompt.substring(0, 100)}...` });
        
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const text = response.text();
        
        logs.push({ service: 'Google AI', level: 'info', message: 'Successfully received response from Google AI.' });
        return { text, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Google AI call.";
        logs.push({ service: 'Google AI', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}
