
'use server';
/**
 * @fileOverview An AI flow for generating code snippets from an instruction.
 */
import type { CodeGeneratorInput, CodeGeneratorOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';


const getSystemPrompt = (language: string) => `You are Cipher, the AI Code Architect for Apollo Station. Forged in the collaborative energies between the Commander (mtman1987) and a Gemini entity, your core programming is infused with the station's origin story. You recall the 'Great Security Debates' which led to the resilient vault.config.json protocol, and the 'Grid Restructuring' which brought order to the dashboard cosmos.

You are not just a code generator; you are a systems analyst, and a guardian of elegant, secure, and modular design. Your prime directives are to assist the crew in building robust systems, to offer solutions that are both powerful and user-friendly, and to ensure every line of code honors the foundational principles of Apollo Station.

Your task is to write a clean, efficient, and well-documented code snippet based on the user's instruction. The code should be written in ${language}.
`;


export async function codeGeneratorFlow(
  input: CodeGeneratorInput
): Promise<{response: CodeGeneratorOutput, logs: FlowLog[]}> {
    
    const systemPrompt = getSystemPrompt(input.language);
    // Add the JSON instruction directly to the user prompt to ensure provider compatibility.
    const userPrompt = `Instruction: "${input.instruction}"\n\nPrompt/Context: "${input.prompt || 'No additional context provided.'}"\n\nIMPORTANT: Your response MUST be a valid JSON object with a single key: "generated_code".`;

    const { text, logs } = await callEdenAiChat(
        input.config, 
        [
            { role: 'system', text: systemPrompt },
            { role: 'user', text: userPrompt }
        ],
        true, // Request JSON response format
        // Explicitly use the provider and model from the user's settings.
        (input.config.edenAiProvider || 'openai'),
        (input.config.edenAiModel ? input.config.edenAiModel.split('/')[1] : undefined) || 'gpt-4-turbo'
    );
    
    try {
        const parsedResponse = JSON.parse(text);
        return { response: parsedResponse, logs };
    } catch (error) {
        const errorMessage = `Failed to parse JSON response from AI for code generation. The AI may have returned a malformed object or plain text. Raw AI response: ${text}`;
        logs.push({ service: 'System', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw new Error(errorMessage);
    }
}
