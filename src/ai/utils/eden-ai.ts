
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
        const errorMsg = "Eden AI API key is not configured.";
        logs.push({ service: 'System', level: 'error', message: errorMsg });
        return { text: JSON.stringify({ explanation: errorMsg, code: null }), logs };
    }
    
    const headers = {
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    const url = "https://api.edenai.run/v2/text/chat";
    
    let provider: string;
    let model: string;

    if (overrideProvider && overrideModel) {
        provider = overrideProvider;
        model = overrideModel;
    } else if (config.edenAiModel && typeof config.edenAiModel === 'string' && config.edenAiModel.includes('/')) {
        [provider, model] = config.edenAiModel.split('/');
    } else {
        provider = config.edenAiProvider || 'openai';
        model = config.edenAiModel || 'gpt-4o';
    }
    
    const lastMessage = history.pop();
    const systemPrompt = history.find(m => m.role === 'system');
    
    const previous_history = history
        .filter(msg => msg.role !== 'system') // Ensure system messages are not in history
        .map(msg => ({
            role: msg.role,
            message: msg.text
        }));
    
    const payload: any = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        temperature: 0.1, // Lower temperature for more predictable, structured output
        max_tokens: 2000,
        providers: provider,
        model: model,
        text: lastMessage?.text || "",
        previous_history: previous_history,
    };
    
    if (systemPrompt) {
        payload.system_prompt = systemPrompt.text;
    }

    if (json_response) {
        payload.response_format = { type: "json_object" };
    }

    try {
        logs.push({ 
            service: 'Eden', 
            level: 'info', 
            message: `Calling Eden AI chat with provider: ${provider}, model: ${model}`, 
            details: `Payload: ${JSON.stringify(payload, null, 2)}` 
        });
        
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
        const providerResponse = result[provider];
        
        if (!providerResponse) {
             throw new Error(`Provider '${provider}' not found in Eden AI response. Full response: ${JSON.stringify(result)}`);
        }
        
        if (providerResponse.status === 'fail') {
            const errorMessage = providerResponse?.error?.message || `An unknown error occurred with the ${provider} provider.`;
            throw new Error(errorMessage);
        }

        const text = providerResponse.generated_text;
        
        if (typeof text !== 'string') {
             throw new Error(`Unexpected response format from Eden AI. 'generated_text' was not a string. Got: ${JSON.stringify(result)}`);
        }
        
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully received response from Eden AI.' });
        return { text, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        
        // Return a structured error instead of throwing, so logs are preserved.
        const errorResponse = {
            explanation: `An error occurred with the AI provider: ${errorMessage}`,
            code: null
        };
        return { text: JSON.stringify(errorResponse), logs };
    }
}
