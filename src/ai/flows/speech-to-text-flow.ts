
'use server';
/**
 * @fileOverview A flow for transcribing audio files to text.
 *
 * - speechToTextFlow - The main function to transcribe audio.
 */
import type { SpeechToTextInput, SpeechToTextOutput, FlowLog, AppConfig } from '@/ai/types';

async function callEdenAiSpeechToText(
    config: AppConfig,
    input: SpeechToTextInput
): Promise<{ result: SpeechToTextOutput, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    logs.push({ service: 'Eden STT', level: 'info', message: `Transcribing audio with provider ${input.provider}...` });
    
    const url = "https://api.edenai.run/v2/audio/speech_to_text_async";
    
    const formData = new FormData();
    formData.append('providers', input.provider);
    formData.append('language', input.language);
    formData.append('file', input.file);
    
    const headers = { "Authorization": `Bearer ${config.edenApiKey}` };

    try {
        const response = await fetch(url, { method: 'POST', body: formData, headers: headers });
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Speech-to-Text failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        const providerResponse = result[input.provider];

        if (!providerResponse || providerResponse.status === 'fail') {
           const errorMessage = providerResponse?.error?.message || "An unknown error occurred during transcription.";
           throw new Error(errorMessage);
        }

        logs.push({ service: 'Eden STT', level: 'info', message: 'Successfully transcribed audio.' });
        return { result: { text: providerResponse.text }, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during audio transcription.";
        logs.push({ service: 'Eden STT', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function speechToTextFlow(input: SpeechToTextInput): Promise<{response: SpeechToTextOutput, logs: FlowLog[]}> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    const { result, logs } = await callEdenAiSpeechToText(config, input);

    return {
        response: result,
        logs: logs,
    };
}
