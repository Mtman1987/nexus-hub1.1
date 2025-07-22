
'use server';
/**
 * @fileOverview A flow for converting text to speech via Eden AI.
 *
 * - ttsFlow - The main function to convert text to a playable audio data URI.
 */
import type { TtsInput, TtsOutput, FlowLog } from '../types';
import type { AppConfig } from '@/ai/types';

async function callEdenAiTts(
    config: AppConfig,
    text: string,
    voiceId: string
): Promise<{ audio: string, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }

    const headers = {
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    const url = "https://api.edenai.run/v2/audio/text_to_speech";
    
    // Determine provider based on voice ID or fallback to settings
    const provider = voiceId.toLowerCase().includes('wavenet') || voiceId.toLowerCase().includes('neural') ? "google" : config.ttsProvider || "google";
    
    // Simplified logic for option based on common voice naming conventions.
    // Eden AI's `option` parameter is often 'MALE' or 'FEMALE'.
    let option = 'MALE';
    if (voiceId.includes('-F') || voiceId.includes('FEMALE')) {
        option = 'FEMALE';
    }


    const payload = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        rate: 0,
        pitch: 0,
        volume: 0,
        sampling_rate: 0,
        providers: provider, 
        language: "en-US",
        option: option,
        text: text,
        voice_id: voiceId // Pass voice ID directly as per API
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI TTS with voice: ${voiceId} on provider: ${provider}` });

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Eden AI TTS API call failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        const providerResult = result[provider];
        
        if (!providerResult || providerResult.status !== 'success') {
            throw new Error(providerResult?.error?.message || `TTS failed for provider ${provider}.`);
        }

        const audioBase64 = providerResult.audio;
        
        logs.push({ service: 'Eden', level: 'info', message: 'Successfully generated audio via Eden AI.' });
        return { audio: `data:audio/mp3;base64,${audioBase64}`, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during Eden AI TTS call.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function ttsFlow(input: TtsInput): Promise<TtsOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
        botVoice: localStorage.getItem('botVoice'),
        ttsProvider: localStorage.getItem('ttsProvider'),
    };
    
    const { text, voice } = input;
    // Use the voice passed in the call, fallback to the globally set bot voice, then to a default.
    const voiceToUse = voice || config.botVoice || 'en-US-Wavenet-F';

    try {
        const { audio, logs } = await callEdenAiTts(config, text, voiceToUse);
        return {
            media: audio,
            logs
        };
    } catch (error) {
        console.error("TTS Flow Error:", error);
        // Let the error propagate so the UI can catch it.
        throw error;
    }
}
