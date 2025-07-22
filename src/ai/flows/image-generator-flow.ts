
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It uses a direct call to the Eden AI API.
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
        providers: "openai", // Or other providers like 'replicate'
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
        const imageUrl = result.openai.items[0].image_resource_url;
        
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
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    // For image generation, we can directly use the user's prompt
    // or keep the enhancement step if preferred. For simplicity, let's use it directly for now.
    
    try {
        const { imageUrl, logs: imageLogs } = await callEdenAiImage(config, input.prompt);
        logs.push(...imageLogs);

        return {
            imageUrl: imageUrl,
            enhancedPrompt: input.prompt, // Since we're not enhancing, just return the original.
        };

    } catch (error) {
        if (error instanceof Error) {
            logs.push({ service: 'Eden', level: 'error', message: error.message, details: error.stack });
        }
        throw error;
    }
}
