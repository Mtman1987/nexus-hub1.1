
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It directly calls the Eden AI image generation endpoint.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';


async function callEdenAiImage(
    config: AppConfig,
    prompt: string,
    provider: string
): Promise<{ imageUrl: string, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }

    const headers = {
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    const url = "https://api.edenai.run/v2/image/generation";

    const payload = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        resolution: "1024x1024",
        num_images: 1,
        providers: provider,
        text: prompt,
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI Image Generation with provider: ${provider}...` });

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Eden AI Image API call failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        
        const providerResponse = result[payload.providers];
        if (!providerResponse || providerResponse.status === 'fail') {
            const errorMessage = providerResponse?.error?.message || `An unknown error occurred with the ${provider} provider.`;
            throw new Error(errorMessage);
        }

        if (!providerResponse.items || providerResponse.items.length === 0) {
            throw new Error(`Unexpected response format from Eden AI Image API. Provider: ${payload.providers}. Response: ${JSON.stringify(result)}`);
        }
        
        const imageUrl = providerResponse.items[0].image_resource_url;
        
        logs.push({ service: 'Eden', level: 'info', message: `Successfully generated image via ${provider}.` });
        return { imageUrl, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI Image call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function imageGeneratorFlow(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
        // Use the globally selected provider from settings, default to openai
        edenAiProvider: localStorage.getItem('edenAiProvider') || 'openai',
    };
    
    try {
        const providerToUse = config.edenAiProvider as string;
        
        const { imageUrl, logs } = await callEdenAiImage(config, input.prompt, providerToUse);

        return {
            imageUrl: imageUrl,
            // Since we are not optimizing, the enhanced prompt is just the original prompt.
            enhancedPrompt: input.prompt, 
            selectedProvider: providerToUse,
        };

    } catch (error) {
        // Errors are logged in the helper function.
        // We re-throw it so the UI layer can catch it and display a toast.
        throw error;
    }
}
