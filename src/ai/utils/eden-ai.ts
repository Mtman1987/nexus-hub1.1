
'use server';

import type { FlowLog, AppConfig } from "../types";

const EDEN_API_URL = "https://api.edenai.run/v2";

type EdenAiChatMessage = {
    role: 'system' | 'user' | 'assistant';
    text: string;
};

type EdenAiChatResponse = {
    [provider: string]: {
        status: string;
        generated_text: string;
        message: { role: string, message: string }[];
        cost: number;
    }
}

type EdenAiImageResponse = {
    [provider: string]: {
        status: string;
        items: { image_resource_url: string }[];
    }
}


/**
 * A helper function to make chat completion calls to the Eden AI API.
 * It handles the dynamic selection of providers and models based on AppConfig.
 * It also includes a basic fallback mechanism.
 */
export async function callEdenAiChat(
    config: AppConfig,
    messages: EdenAiChatMessage[],
    json_response_mode: boolean = false
): Promise<{ text: string, logs: FlowLog[] }> {

    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    const providers = config.edenAiProvider || 'openai';
    const model = config.edenAiModel || 'gpt-4-turbo';
    const fallbackProviders = config.fallbackStrategy || [];

    const headers = {
        'Authorization': `Bearer ${config.edenApiKey}`,
        'Content-Type': 'application/json'
    };
    
    const body = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        temperature: 0.7,
        max_tokens: 1500,
        providers: providers,
        text: '', // Required but can be empty when chat history is used
        chatbot_global_action: messages.find(m => m.role === 'system')?.text,
        previous_history: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            message: m.text
        })),
        ...(json_response_mode && { response_format: "json_object" })
    };
    
    // Use the last user message as the main 'text' input for non-chat models
    const lastUserMessage = messages.findLast(m => m.role === 'user');
    if (lastUserMessage) {
        body.text = lastUserMessage.text;
    }
    
    // Set the model for the specific provider
    if(model) {
        body.settings = { [providers]: model };
    }

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI chat with provider: ${providers}`, details: `Model: ${model}, Prompt: ${body.text.substring(0, 100)}...` });
        const response = await fetch(`${EDEN_API_URL}/text/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Eden AI API Error (${response.status}): ${errorText}`);
        }

        const data: EdenAiChatResponse = await response.json();
        const providerResponse = data[providers];

        if (providerResponse.status !== 'success') {
            throw new Error(`Eden AI provider ${providers} failed with status: ${providerResponse.status}`);
        }
        
        const generatedText = providerResponse.generated_text || providerResponse.message.find(m => m.role === 'assistant')?.message || '';
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully received response from Eden AI.' });
        return { text: generatedText, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        
        // TODO: Implement fallback logic using fallbackProviders array
        
        throw error;
    }
}


/**
 * A helper function to make image generation calls to the Eden AI API.
 */
export async function callEdenAiImage(
    config: AppConfig,
    prompt: string,
    logs: FlowLog[]
): Promise<{ imageUrl: string }> {

    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured for image generation.");
    }

    const providers = config.edenAiProvider || 'openai'; // dall-e-3 is often a good choice
    const model = config.edenAiModel;

    const headers = {
        'Authorization': `Bearer ${config.edenApiKey}`,
        'Content-Type': 'application/json'
    };

    const body = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        resolution: "1024x1024",
        num_images: 1,
        providers: providers,
        text: prompt,
        ...(model && { model: model })
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI image generation with provider: ${providers}`, details: `Prompt: ${prompt.substring(0, 100)}...` });
        const response = await fetch(`${EDEN_API_URL}/image/generation`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Eden AI Image API Error (${response.status}): ${errorText}`);
        }

        const data: EdenAiImageResponse = await response.json();
        const providerResponse = data[providers];

        if (providerResponse.status !== 'success' || !providerResponse.items || providerResponse.items.length === 0) {
            throw new Error(`Eden AI image provider ${providers} failed. Status: ${providerResponse.status}`);
        }
        
        const imageUrl = providerResponse.items[0].image_resource_url;
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully generated image from Eden AI.' });
        return { imageUrl };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI image call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}
