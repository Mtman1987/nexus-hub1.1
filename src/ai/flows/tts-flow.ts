
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
    voice: string
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
    
    // NOTE: Eden AI has different voice models per provider. 
    // This example uses Google's, but you could add logic to select others.
    // A mapping would be needed for voice names to provider voice IDs.
    // For simplicity, we'll hardcode a Google voice model.
    const option = voice.startsWith('en-US-Wavenet') ? 'FEMALE' : 'MALE';

    const payload = {
        response_as_dict: true,
        attributes_as_list: false,
        show_original_response: false,
        rate: 0,
        pitch: 0,
        volume: 0,
        sampling_rate: 0,
        providers: "google", 
        language: "en-US",
        option: option, // This is simplified, real API might differ
        text: text,
        voice_id: voice // Pass voice ID directly
    };

    try {
        logs.push({ service: 'Eden', level: 'info', message: `Calling Eden AI TTS with voice: ${voice}` });

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
        const audioBase64 = result.google.audio;
        
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
        botVoice: localStorage.getItem('botVoice')
    };
    
    const { text, voice } = input;
    const voiceToUse = voice || config.botVoice || 'en-US-Wavenet-F';

    try {
        const { audio } = await callEdenAiTts(config, text, voiceToUse);
        return {
            media: audio,
        };
    } catch (error) {
        console.error("TTS Flow Error:", error);
        throw new Error("Failed to generate text-to-speech audio.");
    }
}
