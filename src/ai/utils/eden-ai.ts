
'use server';

import type { FlowLog, AppConfig } from "../types";

type EdenAiChatMessage = {
    role: 'user' | 'assistant';
    text: string;
};

/**
 * A helper function to make chat completion calls to the Eden AI API.
 */
export async function callEdenAiChat(
    config: AppConfig,
    history: EdenAiChatMessage[],
    json_response: boolean = false
): Promise<{ text: string, logs: FlowLog[] }> {

    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    const headers = {
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    const url = "https://api.edenai.run/v2/llm/chat";
    
    const provider = config.edenAiProvider || 'google';
    const model = config.edenAiModel || 'gemini-1.5-flash-latest';

    const payload = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        temperature: 0.7,
        max_tokens: 1000,
        providers: provider,
        model: model,
        messages: history,
        json_response_format: json_response,
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI chat with provider: ${provider}, model: ${model}`, details: `History length: ${history.length}` });
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Eden AI API call failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        const text = result[provider]['message'][0]['content'];
        
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully received response from Eden AI.' });
        return { text, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}
