// This file acts as the single entry point for all AI-related functionality.
// It orchestrates calls to different AI providers, handles fallback logic,
// and integrates with various services like Discord and Streamer.bot.

import type { LogEntry } from '@/context/LogContext';
import type { 
    UnifiedChatInput, UnifiedChatOutput, 
    IntelligentFallbackInput, IntelligentFallbackOutput, 
    SetupAssistantInput, SetupAssistantOutput,
    FlowLog
} from '@/ai/types';

import { intelligentFallbackFlow } from '@/ai/flows/intelligent-fallback';
import { setupAssistantFlow } from '@/ai/flows/setup-assistant';
import { unifiedChatFlow } from '@/ai/flows/unified-chat-flow';

/**
 * Main function for the Unified Chat module.
 * It takes the user's message and targets and routes them accordingly.
 */
export async function unifiedChat(input: UnifiedChatInput): Promise<UnifiedChatOutput> {
    const logs: FlowLog[] = [];
    
    try {
        const result = await unifiedChatFlow(input);
        logs.push(...result.logs);
        return { reply: result.reply, logs, websiteAction: result.websiteAction };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        logs.push({
            service: 'System',
            level: 'error',
            message: `Unified Chat flow failed: ${errorMessage}`,
            details: error instanceof Error ? error.stack : JSON.stringify(error),
        });
        return { reply: `Error processing request: ${errorMessage}`, logs, websiteAction: null };
    }
}

/**
 * Function to get an AI-powered recommendation for the best service to use for a given task.
 */
export async function getIntelligentFallback(input: IntelligentFallbackInput): Promise<{response: IntelligentFallbackOutput, logs: FlowLog[]}> {
    const logs: FlowLog[] = [];
    try {
        const response = await intelligentFallbackFlow(input);
        logs.push({ service: 'System', level: 'info', message: `Intelligent Fallback recommended: ${response.recommendation}.`, details: `Reason: ${response.reasoning}` });
        return { response, logs };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        logs.push({ service: 'System', level: 'error', message: `Intelligent Fallback flow failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        return {
            response: {
                recommendation: 'Error',
                reasoning: `Failed to get a recommendation: ${errorMessage}`,
            },
            logs
        };
    }
}

/**
 * Function to power the AI assistant within the Setup Wizard.
 */
export async function getSetupAssistantResponse(input: SetupAssistantInput): Promise<{response: SetupAssistantOutput, logs: FlowLog[]}> {
    const logs: FlowLog[] = [];
    try {
        const response = await setupAssistantFlow(input);
         logs.push({ service: 'System', level: 'info', message: `Setup Assistant provided help for topic: ${input.topic}`});
        return { response, logs };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Setup Assistant error:", error);
         logs.push({ service: 'System', level: 'error', message: `Setup Assistant failed: ${errorMessage}` });
        return {
            response: {
                answer: `Sorry, I encountered an error: ${errorMessage}`
            },
            logs
        };
    }
}