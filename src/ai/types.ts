
import type { LogEntry } from "@/context/LogContext";
import { z } from "zod";

export type AiProviderId = 'eden' | 'google' | 'openai' | 'groq';

export type ProviderStatus = {
    [key in AiProviderId]?: 'enabled' | 'disabled';
}

// A generic configuration object that can hold various settings from localStorage.
export type AppConfig = {
    [key: string]: any | null;
};

// Represents a log entry without the timestamp, as it's added by the logging context.
export type FlowLog = Omit<LogEntry, 'timestamp'>;

// --- Unified Chat ---
export interface UnifiedChatInput {
    message: string;
    targets: string[];
    config: AppConfig;
    nexusConnectTargets?: string[];
    isLocalExecution?: boolean; // Used to prevent remote forwarding loops
}

export interface UnifiedChatOutput {
    reply: string;
    logs: FlowLog[];
    websiteAction: {
        type: 'youtube_search',
        query: string,
    } | null;
}

// --- Intelligent Fallback ---
export const IntelligentFallbackInputSchema = z.object({
    goal: z.string(),
    prompt: z.string(),
    config: z.any(),
});
export type IntelligentFallbackInput = z.infer<typeof IntelligentFallbackInputSchema>;

export const IntelligentFallbackOutputSchema = z.object({
    recommendation: z.string(),
    reasoning: z.string(),
});
export type IntelligentFallbackOutput = z.infer<typeof IntelligentFallbackOutputSchema>;


// --- Setup Assistant ---
export const SetupAssistantInputSchema = z.object({
    topic: z.string(),
    question: z.string(),
});
export type SetupAssistantInput = z.infer<typeof SetupAssistantInputSchema>;

export const SetupAssistantOutputSchema = z.object({
    answer: z.string(),
});
export type SetupAssistantOutput = z.infer<typeof SetupAssistantOutputSchema>;

// --- Website Control ---
export const WebsiteControlInputSchema = z.object({
    command: z.string(),
});
export type WebsiteControlInput = z.infer<typeof WebsiteControlInputSchema>;

export const WebsiteControlOutputSchema = z.object({
    searchQuery: z.string(),
});
export type WebsiteControlOutput = z.infer<typeof WebsiteControlOutputSchema>;
