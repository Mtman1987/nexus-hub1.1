// This file acts as the single entry point for all AI-related functionality.
// It orchestrates calls to different AI providers, handles fallback logic,
// and integrates with various services like Discord and Streamer.bot.

import type { LogEntry } from '@/context/LogContext';
import type { 
    UnifiedChatInput, UnifiedChatOutput, 
    IntelligentFallbackInput, IntelligentFallbackOutput, 
    SetupAssistantInput, SetupAssistantOutput 
} from '@/ai/types';

import { intelligentFallbackFlow } from '@/ai/flows/intelligent-fallback';
import { setupAssistantFlow } from '@/ai/flows/setup-assistant';
import { unifiedChatFlow } from '@/ai/flows/unified-chat-flow';

/**
 * Main function for the Unified Chat module.
 * It takes the user's message and targets and routes them accordingly.
 */
export async function unifiedChat(input: UnifiedChatInput): Promise<UnifiedChatOutput> {
    const logs: Omit<LogEntry, 'timestamp'>[] = [];
    let reply = '';
    
    try {
        const result = await unifiedChatFlow(input);
        logs.push(...result.logs);
        reply = result.reply;
        return { reply, logs, websiteAction: result.websiteAction };

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
export async function getIntelligentFallback(input: IntelligentFallbackInput): Promise<IntelligentFallbackOutput> {
     try {
        return await intelligentFallbackFlow(input);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Intelligent Fallback error:", error);
        return {
            recommendation: 'Error',
            reasoning: `Failed to get a recommendation: ${errorMessage}`,
        };
    }
}

/**
 * Function to power the AI assistant within the Setup Wizard.
 */
export async function getSetupAssistantResponse(input: SetupAssistantInput): Promise<SetupAssistantOutput> {
    try {
        return await setupAssistantFlow(input);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Setup Assistant error:", error);
        return {
            answer: `Sorry, I encountered an error: ${errorMessage}`
        };
    }
}
