
'use server';
/**
 * @fileOverview This file contains the core AI calling logic.
 * It abstracts the complexity of handling different APIs, fallback logic, and configuration.
 */

import type { FlowLog } from '@/ai/types';

type AiProviderId = 'eden' | 'google' | 'openai' | 'groq';

type CallAIChatParams = {
    userMessage: string;
    systemPrompt?: string;
    jsonMode?: boolean;
    overrideConfig?: { [key: string]: any | undefined };
};

const PROVIDER_CONFIG = {
    eden: { name: 'Eden AI', keyName: 'edenApiKey', modelKey: 'edenAiModelName', url: 'https://api.edenai.run/v2/text/chat' },
    google: { name: 'Google AI', keyName: 'googleApiKey', modelKey: 'googleModelName', url: 'https://generativelanguage.googleapis.com/v1beta/models' },
    openai: { name: 'OpenAI', keyName: 'openaiApiKey', modelKey: 'openaiModelName', url: 'https://api.openai.com/v1/chat/completions' },
    groq: { name: 'Groq', keyName: 'groqApiKey', modelKey: 'groqModelName', url: 'https://api.groq.com/openai/v1/chat/completions' },
};

function getConfig(overrideConfig?: { [key:string]: any | undefined }) {
    if (overrideConfig && Object.keys(overrideConfig).length > 0) {
        return (key: string) => overrideConfig[key];
    }
    // Since this runs on the server, we can't use localStorage directly.
    // The overrideConfig pattern ensures that components pass the necessary settings from the client.
    return (key: string) => {
        console.warn(`Attempted to access configuration '${key}' on the server without it being passed in overrideConfig.`);
        return undefined;
    };
}

/**
 * The core function for making AI chat completion calls. It handles different providers and fallback logic.
 */
export async function callAIChat(params: CallAIChatParams): Promise<{ response: any; logs: FlowLog[] }> {
    const { userMessage, systemPrompt = 'You are a helpful assistant.', jsonMode = false, overrideConfig } = params;
    const logs: FlowLog[] = [];
    const config = getConfig(overrideConfig);
    
    let providerStatus: any = {};
    try {
        const statusString = config('providerStatus');
        if (statusString) {
            // It might be a stringified object or the object itself
            providerStatus = typeof statusString === 'string' ? JSON.parse(statusString) : statusString;
        }
    } catch (e) {
        console.error("Could not parse providerStatus", e);
    }
    
    let fallbackStrategy: AiProviderId[] = ['google', 'openai', 'groq'];
     try {
        const strategyString = config('fallbackStrategy');
        if (strategyString) {
            fallbackStrategy = typeof strategyString === 'string' ? JSON.parse(strategyString) : strategyString;
        }
    } catch (e) {
        console.error("Could not parse fallbackStrategy", e);
    }
    
    const providerTryOrder: AiProviderId[] = ['eden', ...fallbackStrategy];

    for (const providerId of providerTryOrder) {
        const providerInfo = PROVIDER_CONFIG[providerId];
        const apiKey = config(providerInfo.keyName);

        if (!apiKey) {
            logs.push({ service: providerInfo.name, level: 'warn', message: `Skipping provider: API key is not configured.` });
            continue;
        }
        if (providerId !== 'eden' && providerStatus[providerId] === 'disabled') {
            logs.push({ service: providerInfo.name, level: 'warn', message: `Skipping provider: Service is disabled in settings.` });
            continue;
        }

        try {
            logs.push({ service: providerInfo.name, level: 'info', message: `Attempting API call.` });
            
            let response;
            const modelName = config(providerInfo.modelKey) || config(providerId === 'eden' ? 'edenAiModel' : providerInfo.modelKey);


            if (providerId === 'eden') {
                response = await callEdenAI(apiKey, modelName, systemPrompt, userMessage, jsonMode);
            } else if (providerId === 'google') {
                response = await callGoogleAI(apiKey, modelName, systemPrompt, userMessage, jsonMode);
            } else if (providerId === 'openai' || providerId === 'groq') {
                 response = await callOpenAICompatible(providerInfo.url, apiKey, modelName, systemPrompt, userMessage, jsonMode);
            } else {
                throw new Error(`Unknown provider: ${providerId}`);
            }

            logs.push({ service: providerInfo.name, level: 'info', message: `API call successful.` });
            return { response, logs };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logs.push({ service: providerInfo.name, level: 'error', message: `API call failed: ${errorMessage}`, details: error instanceof Error ? error.stack : undefined });
        }
    }

    throw new Error("All configured AI providers failed. Please check your API keys and settings.");
}

// --- Provider-Specific Implementations ---

async function callEdenAI(apiKey: string, modelIdentifier: string | null, system: string, user: string, json: boolean) {
    if (!modelIdentifier) {
        throw new Error("Eden AI model identifier is not configured.");
    }
    
    const [provider, model] = modelIdentifier.split('/');
    if (!provider || !model) {
        throw new Error(`Invalid Eden AI model format: "${modelIdentifier}". Expected "provider/model_name".`);
    }

    const payload = {
        providers: provider,
        model: model,
        text: user,
        chatbot_global_action: system,
        previous_history: [],
        temperature: 0.0,
        max_tokens: 1000,
        response_as_dict: json,
    };

    const response = await fetch(PROVIDER_CONFIG.eden.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`EdenAI request failed with status ${response.status}: ${await response.text()}`);
    
    const result = await response.json();
    const providerResult = result[provider];

    if (!providerResult || providerResult.status !== 'success') {
        throw new Error(`EdenAI call failed: ${providerResult?.error?.message || 'Unknown error from Eden AI'}`);
    }
    
    return json ? JSON.parse(providerResult.generated_text) : providerResult.generated_text;
}


async function callOpenAICompatible(url: string, apiKey: string, model: string | null, system: string, user: string, json: boolean) {
    const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
    const payload: any = { model: model, messages };
    if (json) payload.response_format = { type: 'json_object' };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) throw new Error(`OpenAI-compatible request failed with status ${response.status}: ${await response.text()}`);

    const result = await response.json();
    const content = result.choices[0].message.content;
    return json ? JSON.parse(content) : content;
}


async function callGoogleAI(apiKey: string, model: string | null, system: string, user: string, json: boolean) {
    const url = `${PROVIDER_CONFIG.google.url}/${model || 'gemini-1.5-flash-latest'}:generateContent?key=${apiKey}`;
    const contents = [{ role: 'user', parts: [{ text: user }] }];
    
    const generationConfig = {
        response_mime_type: json ? 'application/json' : 'text/plain',
    };

    const payload: any = {
        contents,
        systemInstruction: { role: 'system', parts: [{ text: system }] },
        generationConfig,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Google AI request failed with status ${response.status}: ${await response.text()}`);
    
    const result = await response.json();
    if(!result.candidates || result.candidates.length === 0){
        const errorDetails = result.promptFeedback ? `Safety issue: ${result.promptFeedback.blockReason}` : 'No response from model.';
        throw new Error(`Google AI call failed: ${errorDetails}`);
    }
    const content = result.candidates[0].content.parts[0].text;
    return content; // Google returns JSON as a string, so no need for conditional parsing here.
}
