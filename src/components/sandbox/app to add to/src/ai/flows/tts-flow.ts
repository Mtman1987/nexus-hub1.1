
'use server';
/**
 * @fileOverview A flow for converting text to speech via Eden AI.
 *
 * - ttsFlow - The main function to convert text to a playable audio data URI.
 */
import type { TtsInput, TtsOutput, FlowLog, AppConfig } from '../types';

async function callEdenAiTts(
    config: AppConfig,
    input: TtsInput
): Promise<{ result: TtsOutput, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured for TTS.");
    }
    
    const provider = input.config?.ttsProvider || 'google'; // Default to google via Eden
    logs.push({ service: 'Eden TTS', level: 'info', message: `Generating audio with provider ${provider}...` });
    
    const url = "https://api.edenai.run/v2/audio/text_to_speech";
    const payload = {
        providers: provider,
        language: "en-US", // Or make this configurable if needed
        option: "FEMALE", // Or make this configurable
        text: input.text,
        rate: 0,
        pitch: 0,
        volume: 0,
    };
    const headers = { 
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`TTS generation failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        const providerResponse = result[provider];
        
        if (!providerResponse || providerResponse.status !== 'success') {
           throw new Error(providerResponse?.error?.message || `An unknown error occurred during TTS generation with provider '${provider}'.`);
        }

        logs.push({ service: 'Eden TTS', level: 'info', message: 'Successfully generated audio.' });
        
        // Eden AI returns the audio as a data URI string in audio_resource_url
        return { 
            result: { 
                media: providerResponse.audio_resource_url,
            }, 
            logs 
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during TTS generation.";
        logs.push({ service: 'Eden TTS', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function ttsFlow(input: TtsInput): Promise<{response: TtsOutput, logs: FlowLog[]}> {
    const { result, logs } = await callEdenAiTts(input.config, input);

    return {
        response: result,
        logs: logs,
    };
}
