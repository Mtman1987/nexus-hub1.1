
'use server';
/**
 * @fileOverview An AI flow for intelligently selecting the best provider for a given task.
 * This is a placeholder and currently just uses the default code generation.
 *
 * - intelligentFallbackFlow - The main function to get a recommendation.
 */
import type { CodeGeneratorInput, CodeGeneratorOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';


async function callEdenAiCodeGeneration(
    config: AppConfig,
    input: CodeGeneratorInput
): Promise<{ result: CodeGeneratorOutput, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    logs.push({ service: 'Eden CodeGen', level: 'info', message: `Generating code for language: ${input.language}...` });
    
    const url = "https://api.edenai.run/v2/text/code_generation";
    const payload = {
        providers: input.config.edenAiProvider || 'openai',
        prompt: input.prompt || '',
        instruction: input.instruction,
        temperature: 0.1,
        max_tokens: 1500,
        // The model can be specified if the provider supports it, e.g., 'gpt-4o' for openai
        ...(input.config.edenAiModel && { model: input.config.edenAiModel.split('/')[1] })
    };
    const headers = { 
        "Authorization": `Bearer ${config.edenApiKey}`,
        "Content-Type": "application/json"
    };

    try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Code Generation failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        const provider = payload.providers;
        const providerResponse = result[provider];
        
        if (!providerResponse || providerResponse.status !== 'success') {
           throw new Error(providerResponse?.error?.message || "An unknown error occurred during code generation.");
        }

        logs.push({ service: 'Eden CodeGen', level: 'info', message: 'Successfully generated code.' });
        // The API returns the code in 'generated_text'. We map it to our 'generated_code' field.
        return { result: { generated_code: providerResponse.generated_text }, logs };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during code generation.";
        logs.push({ service: 'Eden CodeGen', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function intelligentFallbackFlow(
  input: CodeGeneratorInput
): Promise<{response: CodeGeneratorOutput, logs: FlowLog[]}> {
    
    // This flow is a placeholder. A real implementation would involve a meta-AI call
    // to decide which provider/model is best for the user's `goal` and `prompt`.
    // For now, it just defaults to the standard code generation.
    const { result, logs } = await callEdenAiCodeGeneration(input.config, input);

    return {
        response: result,
        logs: logs,
    };
}
