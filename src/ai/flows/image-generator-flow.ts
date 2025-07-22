
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It uses a two-step process:
 * 1. Optimize the user's prompt via Eden AI's prompt_optimization endpoint.
 * 2. Generate an image using the optimized prompt via Eden AI's image/generation endpoint.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';

async function optimizePrompt(
    config: AppConfig,
    prompt: string
): Promise<{ enhancedPrompt: string, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }

    const headers = {
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    const url = "https://api.edenai.run/v2/text/prompt_optimization";

    const payload = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        providers: "openai", // Use OpenAI for its strong prompt understanding
        text: prompt,
        target_provider: "google", // Optimize for a generic high-quality provider
    };
    
    try {
        logs.push({ service: 'Eden', level: 'info', message: `Optimizing prompt via OpenAI...`, details: `Original prompt: ${prompt}` });

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Eden AI Prompt Optimization API call failed with status ${response.status}: ${errorBody}`);
        }
        
        const result = await response.json();
        
        if (!result.openai || !result.openai.text) {
             throw new Error(`Unexpected response format from Prompt Optimization API. Response: ${JSON.stringify(result)}`);
        }

        const enhancedPrompt = result.openai.text;
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully optimized prompt.' });
        return { enhancedPrompt, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during prompt optimization.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


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
        providers: "openai", // Using openai as a reliable default
        text: prompt,
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI Image Generation with enhanced prompt...` });

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
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    try {
        // Step 1: Optimize the prompt
        const { enhancedPrompt, logs: optimizeLogs } = await optimizePrompt(config, input.prompt);
        logs.push(...optimizeLogs);
        
        // Step 2: Generate the image with the enhanced prompt
        const { imageUrl, logs: imageLogs } = await callEdenAiImage(config, enhancedPrompt);
        logs.push(...imageLogs);

        return {
            imageUrl: imageUrl,
            enhancedPrompt: enhancedPrompt, 
        };

    } catch (error) {
        // Errors are logged in the helper functions.
        // We re-throw it so the UI layer can catch it and display a toast.
        throw error;
    }
}
