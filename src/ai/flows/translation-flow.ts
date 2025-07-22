
'use server';
/**
 * @fileOverview A flow for translating text between languages.
 *
 * - translationFlow - The main function to translate text.
 */
import type { TranslationInput, TranslationOutput, FlowLog, AppConfig } from '@/ai/types';

async function callEdenAiTranslation(
    config: AppConfig,
    input: TranslationInput
): Promise<{ result: TranslationOutput, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    logs.push({ service: 'Eden Translate', level: 'info', message: `Translating text with provider ${input.provider}...` });
    
    const url = "https://api.edenai.run/v2/translation/automatic_translation";
    const payload = {
        providers: input.provider,
        text: input.text,
        source_language: input.sourceLang,
        target_language: input.targetLang,
    };
    const headers = { "Authorization": `Bearer ${config.edenApiKey}`, "Content-Type": "application/json" };

    try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Translation failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        const providerResponse = result[input.provider];

        if (!providerResponse || providerResponse.status !== 'success') {
           throw new Error(providerResponse?.error?.message || "An unknown error occurred during translation.");
        }

        logs.push({ service: 'Eden Translate', level: 'info', message: 'Successfully translated text.' });
        return { result: providerResponse as TranslationOutput, logs };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during translation.";
        logs.push({ service: 'Eden Translate', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function translationFlow(input: TranslationInput): Promise<{response: TranslationOutput, logs: FlowLog[]}> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    const { result, logs } = await callEdenAiTranslation(config, input);

    return {
        response: result,
        logs: logs,
    };
}
