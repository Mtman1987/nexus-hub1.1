
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It uses a three-step process:
 * 1. Intelligently select the best provider for the prompt.
 * 2. Optimize the user's prompt for the selected provider.
 * 3. Generate an image using the selected provider and the optimized prompt.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';


async function selectBestProvider(
    config: AppConfig,
    prompt: string
): Promise<{ provider: string, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    const systemPrompt = `You are an expert AI art director. Your job is to select the best image generation provider for a given prompt. The available providers are "openai", "stabilityai", "bytedance", "replicate", and "amazon".

- Choose "openai" for complex scenes, natural language, and brand-safe content.
- Choose "stabilityai" for general purpose, creative, and photorealistic images.
- Choose "bytedance" for high-quality anime, manga, or stylized character art.
- Choose "replicate" for accessing a wide variety of open-source models and specific, experimental artistic styles.
- Choose "amazon" for high-realism, clean object renders, and product-style photography.

Analyze the user's prompt and decide which of the providers is the best fit. Your response MUST be a valid JSON object with a single key "provider".
Example: {"provider": "stabilityai"}`;

    const userPrompt = `User's prompt: "${prompt}"`;

    try {
        logs.push({ service: 'Eden', level: 'info', message: 'Selecting best image provider...' });
        const { text, logs: chatLogs } = await callEdenAiChat(
            config,
            [{ role: 'system', text: systemPrompt }, { role: 'user', text: userPrompt }],
            true, // JSON response
            'google',
            'gemini-1.5-flash-latest'
        );
        logs.push(...chatLogs);
        const result = JSON.parse(text);
        const provider = result.provider;
        if (!['openai', 'stabilityai', 'bytedance', 'replicate', 'amazon'].includes(provider)) {
            throw new Error(`AI returned an invalid provider: ${provider}`);
        }
        logs.push({ service: 'Eden', level: 'info', message: `Selected provider: ${provider}` });
        return { provider, logs };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during provider selection.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        // Fallback to a safe default if selection fails
        return { provider: 'openai', logs };
    }
}


async function optimizePrompt(
    config: AppConfig,
    prompt: string,
    targetProvider: string
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
        target_provider: targetProvider,
    };
    
    try {
        logs.push({ service: 'Eden', level: 'info', message: `Optimizing prompt for target provider: ${targetProvider}...` });

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
        if (!providerResponse || !providerResponse.items || providerResponse.items.length === 0) {
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
    const logs: FlowLog[] = [];
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    try {
        // Step 1: Select the best provider
        const { provider, logs: selectLogs } = await selectBestProvider(config, input.prompt);
        logs.push(...selectLogs);
        
        // Step 2: Optimize the prompt for the selected provider
        const { enhancedPrompt, logs: optimizeLogs } = await optimizePrompt(config, input.prompt, provider);
        logs.push(...optimizeLogs);
        
        // Step 3: Generate the image with the selected provider and enhanced prompt
        const { imageUrl, logs: imageLogs } = await callEdenAiImage(config, enhancedPrompt, provider);
        logs.push(...imageLogs);

        return {
            imageUrl: imageUrl,
            enhancedPrompt: enhancedPrompt,
            selectedProvider: provider,
        };

    } catch (error) {
        // Errors are logged in the helper functions.
        // We re-throw it so the UI layer can catch it and display a toast.
        throw error;
    }
}
