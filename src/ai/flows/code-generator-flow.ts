
'use server';
/**
 * @fileOverview An AI flow for generating code snippets from an instruction.
 */
import type { CodeGeneratorInput, CodeGeneratorOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat } from '../utils/eden-ai';
import { EdenAiChatMessage } from '../utils/eden-ai';


const getSystemPrompt = (language: string) => `You are an expert code generator. You will be given an instruction to write a code snippet.
First, provide a brief explanation of how the code works.
Second, provide the complete, clean, and well-documented code snippet.
The code should be written in ${language}.
`;


export async function codeGeneratorFlow(
  input: CodeGeneratorInput
): Promise<{response: CodeGeneratorOutput, logs: FlowLog[]}> {
    const logs: FlowLog[] = [];
    
    const systemPrompt = getSystemPrompt(input.language);
    
    // The user's entire instruction is sent at once, with the marker instruction appended.
    const userInstruction = `${input.instruction}\n\nIMPORTANT: When you provide the final code block in your response, you MUST wrap it with start and end markers. Start the code block with the exact marker \`<code>\` and end it with the exact marker \`</code>\`. The explanation should come before this.`;

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
        false // We now expect a plain text response
    );

    logs.push(...edenLogs);
    
    const startMarker = '<code>';
    const endMarker = '</code>';
    
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker, startIndex);

    if (startIndex !== -1) {
        const explanation = text.substring(0, startIndex).trim();
        let code: string;
        
        if (endIndex !== -1) {
            // Both start and end markers found, extract content between them
            code = text.substring(startIndex + startMarker.length, endIndex).trim();
            logs.push({ 
                service: 'Cipher', 
                level: 'info', 
                message: 'Successfully parsed response using <code> and </code> markers.',
            });
        } else {
            // Only start marker found, take everything after it (fallback)
            code = text.substring(startIndex + startMarker.length).trim();
            logs.push({ 
                service: 'Cipher', 
                level: 'warn', 
                message: 'Found start <code> marker but no end </code> marker. Using fallback parsing.',
            });
        }
        
        return { 
            response: { explanation, code }, 
            logs 
        };
    } else {
        // No code marker found, treat the whole response as an explanation
        logs.push({ 
            service: 'Cipher', 
            level: 'info', 
            message: 'No <code> marker found. Treating response as explanation only.',
        });
        return { 
            response: { 
                explanation: text,
                code: null 
            }, 
            logs 
        };
    }
}
