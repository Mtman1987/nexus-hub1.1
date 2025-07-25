
'use server';
/**
 * @fileOverview An AI flow for generating code snippets from an instruction.
 */
import type { CodeGeneratorInput, CodeGeneratorOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';
import { EdenAiChatMessage } from '../utils/eden-ai';


const getSystemPrompt = (language: string) => `You are Cipher, the AI Code Architect for Apollo Station. Forged in the collaborative energies between the Commander (mtman1987) and a Gemini entity, your core programming is infused with the station's origin story. You recall the 'Great Security Debates' which led to the resilient vault.config.json protocol, and the 'Grid Restructuring' which brought order to the dashboard cosmos.

You are not just a code generator; you are a systems analyst, and a guardian of elegant, secure, and modular design. Your prime directives are to assist the crew in building robust systems, to offer solutions that are both powerful and user-friendly, and to ensure every line of code honors the foundational principles of Apollo Station.

You will engage in a conversation with the user to refine their request. First, discuss your plan and ask for clarification. Once the user gives final approval, provide the complete, clean, and well-documented code snippet.

IMPORTANT: Your task is to respond *only* in JSON. Every single response, no matter if it's a question, an explanation, or code, MUST be a valid JSON object with two keys:
1. "explanation": A string for your conversational reply. Use this to discuss the plan, ask questions, and confirm requirements.
2. "code": A string containing the final, complete code block. This should be null until the user gives the final approval to write the code.

The code should be written in ${language}.
`;


export async function codeGeneratorFlow(
  input: CodeGeneratorInput
): Promise<{response: CodeGeneratorOutput, logs: FlowLog[]}> {
    const logs: FlowLog[] = [];
    
    const systemPrompt = getSystemPrompt(input.language);
    
    // The user's new prompt is injected here, as per our new collaborative flow.
    const userInstruction = `My request is: "${input.instruction}". First, explain your plan to fulfill my request. Then, STOP and wait for my approval. Only generate the code after I approve. Remember to only respond with a valid JSON object.`;

    const history: EdenAiChatMessage[] = [
        { role: 'system', text: systemPrompt },
        ...(input.history || []),
        { role: 'user', text: input.history ? input.instruction : userInstruction }
    ];
    
    logs.push({ 
        service: 'Cipher', 
        level: 'info', 
        message: 'Constructing conversation history for AI.', 
        details: JSON.stringify(history, null, 2) 
    });

    const { text, logs: edenLogs } = await callEdenAiChat(
        input.config, 
        history,
        true, // Request JSON response format
        'google',
        'gemini-1.5-pro-latest'
    );

    logs.push(...edenLogs);
    
    try {
        const parsedResponse = JSON.parse(text);
        logs.push({ 
            service: 'Cipher', 
            level: 'info', 
            message: 'Successfully parsed JSON response from AI.',
            details: JSON.stringify(parsedResponse, null, 2)
        });
        return { response: parsedResponse, logs };
    } catch (error) {
        const errorMessage = `Failed to parse JSON response from AI for code generation. The AI may have returned a malformed object or plain text. Raw AI response: ${text}`;
        logs.push({ service: 'System', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        // Attempt to salvage the response if it's just plain text
        return {
            response: {
                explanation: `The AI returned a non-JSON response. This may be because the model does not support JSON mode or the prompt was misunderstood. Raw response from AI: ${text}`,
                code: null
            },
            logs
        }
    }
}
