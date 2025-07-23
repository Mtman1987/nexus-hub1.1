
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
    
    // Determine provider and model from settings or overrides
    let provider: string;
    let model: string;

    if (overrideProvider && overrideModel) {
        provider = overrideProvider;
        model = overrideModel;
    } else if (config.edenAiModel && typeof config.edenAiModel === 'string' && config.edenAiModel.includes('/')) {
        [provider, model] = config.edenAiModel.split('/');
    } else {
        // Fallback to older settings or defaults if the new format isn't present
        provider = config.edenAiProvider || 'openai'; // Default to a common provider
        model = config.edenAiModel || 'gpt-4o'; // Default to a common model
    }
    

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
        let text = '';

        if (responseProvider && responseProvider.generated_text) {
             text = responseProvider.generated_text;
        } else if (result.choices && result.choices[0]?.message?.content) {
            // Handle cases where the response is not nested under the provider key
            text = result.choices[0].message.content;
        } else if (responseProvider) {
            // If the provider key exists but something else is wrong
             throw new Error(`Unexpected response format from Eden AI. Expected 'generated_text' string. Got: ${JSON.stringify(responseProvider)}`);
        } else {
            // If the provider key is missing entirely
            throw new Error(`Provider '${provider}' not found in Eden AI response. Full response: ${JSON.stringify(result)}`);
        }
        
        if (typeof text !== 'string') {
             throw new Error(`Unexpected response format from Eden AI. 'generated_text' was not a string. Got: ${JSON.stringify(responseProvider || result)}`);
        }
        
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully received response from Eden AI.' });
        return { text, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}
