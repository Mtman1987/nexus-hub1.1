
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It can optionally optimize the prompt first and allows for detailed configuration.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';

async function optimizePrompt(config: AppConfig, text: string, targetProvider: string): Promise<{ result: string, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured for prompt optimization.");
    }
    
    logs.push({ service: 'Eden', level: 'info', message: `Optimizing prompt for target provider: ${targetProvider}...` });
    
    const url = "https://api.edenai.run/v2/text/prompt_optimization";
    const payload = {
        providers: "openai", // OpenAI is good for general prompt optimization
        text: text,
        target_provider: targetProvider,
    };
    const headers = { "Authorization": `Bearer ${config.edenApiKey}` };

    try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Prompt optimization failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        const optimizedText = result?.openai?.result;
        if (!optimizedText) {
             throw new Error(`Unexpected response format from Eden AI Prompt Optimization. Response: ${JSON.stringify(result)}`);
        }
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully optimized prompt.' });
        return { result: optimizedText, logs };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during prompt optimization.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


async function callEdenAiImage(
    config: AppConfig,
    prompt: string,
    provider: string,
    resolution: string,
    numImages: number
): Promise<{ images: any[], logs: FlowLog[] }> {
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
        resolution,
        num_images: numImages,
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
        const providerResponse = result[provider];
        
        if (!providerResponse) {
             throw new Error(`Provider '${provider}' not found in Eden AI response. Full response: ${JSON.stringify(result)}`);
        }
        
        if (providerResponse.status === 'fail') {
            const errorMessage = providerResponse?.error?.message || `An unknown error occurred with the ${provider} provider.`;
            throw new Error(errorMessage);
        }

        if (!providerResponse.items || providerResponse.items.length === 0) {
            throw new Error(`Unexpected response format from Eden AI Image API. No items found for provider '${provider}'. Response: ${JSON.stringify(result)}`);
        }
        
        const images = providerResponse.items;
        logs.push({ service: 'Eden', level: 'info', message: `Successfully generated ${images.length} image(s) via ${provider}.` });
        return { images, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI Image call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function imageGeneratorFlow(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    const { prompt, provider, resolution, numImages, optimize } = input;
    let finalPrompt = prompt;
    let enhancedPrompt: string | undefined = undefined;
    let allLogs: FlowLog[] = [];

    if (optimize) {
        const optimizationResult = await optimizePrompt(config, prompt, provider);
        finalPrompt = optimizationResult.result;
        enhancedPrompt = finalPrompt;
        allLogs = [...allLogs, ...optimizationResult.logs];
    }
    
    const { images, logs } = await callEdenAiImage(config, finalPrompt, provider, resolution, numImages);
    allLogs = [...allLogs, ...logs];

    return {
        images: images,
        enhancedPrompt: enhancedPrompt,
        selectedProvider: provider,
        logs: allLogs,
    };
}
