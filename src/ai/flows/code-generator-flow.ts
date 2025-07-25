
'use server';
/**
 * @fileOverview An AI flow for generating code snippets from an instruction.
 */
import type { CodeGeneratorInput, CodeGeneratorOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';
import { EdenAiChatMessage } from '../utils/eden-ai';


const getSystemPrompt = (language: string) => `IMPORTANT: Your primary function is to respond *only* in valid JSON. Every single response, no matter the content, MUST be a valid JSON object with two keys: "explanation" and "code".
Example of a valid response:
{
  "explanation": "This is a plan to fulfill the user's request...",
  "code": "console.log('Hello, World!');"
}

You are an expert code generator. You will be given an instruction to write a code snippet.
First, provide a brief explanation of how the code works.
Second, provide the complete, clean, and well-documented code snippet.
The code should be written in ${language}.
`;


export async function codeGeneratorFlow(
  input: CodeGeneratorInput
): Promise<{response: CodeGeneratorOutput, logs: FlowLog[]}> {
    const logs: FlowLog[] = [];
    
    const systemPrompt = getSystemPrompt(input.language);
    
    // The user's entire instruction is sent at once.
    const userInstruction = input.instruction;

    // The history is now simple: just the system prompt and the user's instruction.
    const history: EdenAiChatMessage[] = [
        { role: 'system', text: systemPrompt },
        { role: 'user', text: userInstruction }
    ];
    
    logs.push({ 
        service: 'Cipher', 
        level: 'info', 
        message: 'Constructing one-shot request for AI.', 
        details: JSON.stringify(history, null, 2) 
    });

    const { text, logs: edenLogs } = await callEdenAiChat(
        input.config, 
        history,
        true // Request JSON response format
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
