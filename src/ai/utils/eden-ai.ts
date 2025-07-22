
'use server';

import type { FlowLog, AppConfig } from "../types";

export type EdenAiChatMessage = {
    role: 'user' | 'assistant' | 'system';
    text: string;
};

/**
 * A helper function to make chat completion calls to the Eden AI API.
 * This is designed to be more robust and handle different message structures.
 */
export async function callEdenAiChat(
    config: AppConfig,
    history: EdenAiChatMessage[],
    json_response: boolean = false,
    overrideProvider?: string,
    overrideModel?: string
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
    
    // Use overrides if provided, otherwise use settings from config
    const provider = overrideProvider || config.edenAiProvider || 'google';
    const model = overrideModel || (config.edenAiModel ? config.edenAiModel.split('/')[1] : 'gemini-1.5-flash-latest');

    // Transform our simple history into the structure Eden AI expects
    const messages = history.map(msg => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.text }]
    }));
    
    // Eden AI's API is a bit particular. The 'system' role is often passed at the top level.
    let system_prompt = '';
    const chat_messages = messages.filter(msg => {
        if (msg.role === 'system') {
            system_prompt = msg.content[0].text;
            return false; // Don't include system messages in the main array
        }
        return true;
    });


    const payload: any = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        temperature: 0.7,
        max_tokens: 2000,
        providers: provider,
        model: model,
        messages: chat_messages,
    };
    
    if (system_prompt) {
        payload.system_prompt = system_prompt;
    }

    if (json_response) {
        payload.response_format = { type: "json_object" };
    }

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
        
        // Handle potential variations in the response structure
        const responseProvider = result[provider];
        if (!responseProvider) {
             throw new Error(`Provider '${provider}' not found in Eden AI response. Full response: ${JSON.stringify(result)}`);
        }

        const text = responseProvider.generated_text;
        
        if (typeof text !== 'string') {
             throw new Error(`Unexpected response format from Eden AI. Expected 'generated_text' string. Got: ${JSON.stringify(responseProvider)}`);
        }
        
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully received response from Eden AI.' });
        return { text, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}
