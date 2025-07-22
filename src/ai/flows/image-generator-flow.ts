
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It uses a direct call to the Eden AI API's image endpoint.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';

async function callEdenAiImage(
    config: AppConfig,
    prompt: string
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
        providers: "openai", // You can also parameterize this if needed e.g., 'replicate', 'stabilityai'
        text: prompt,
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI Image Generation with prompt: ${prompt.substring(0, 100)}...` });

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
        
        // The provider name is part of the response key
        const providerResponse = result[payload.providers];
        if (!providerResponse || !providerResponse.items || providerResponse.items.length === 0) {
            throw new Error(`Unexpected response format from Eden AI Image API. Provider: ${payload.providers}. Response: ${JSON.stringify(result)}`);
        }

        const imageUrl = providerResponse.items[0].image_resource_url;
        
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully generated image via Eden AI.' });
        return { imageUrl, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI Image call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function imageGeneratorFlow(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    const logs: FlowLog[] = [];
    const config: AppConfig = {
        // We can get the primary key directly. This assumes image generation is always on if the key exists.
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    // For now, we'll use the user's prompt directly. 
    // An enhancement step could be added here later if desired.
    
    try {
        const { imageUrl, logs: imageLogs } = await callEdenAiImage(config, input.prompt);
        logs.push(...imageLogs);

        return {
            imageUrl: imageUrl,
            // Since we aren't enhancing the prompt in this version, we'll just return the original.
            enhancedPrompt: input.prompt, 
        };

    } catch (error) {
        // The error is already logged in the callEdenAiImage function.
        // We re-throw it so the UI layer can catch it and display a toast.
        throw error;
    }
}
