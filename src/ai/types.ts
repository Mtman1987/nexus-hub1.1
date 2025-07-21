import type { LogEntry } from "@/context/LogContext";

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

// Input for the main chat flow
export interface UnifiedChatInput {
    message: string;
    targets: string[];
    config: AppConfig;
    nexusConnectTargets?: string[];
}

// Output from the main chat flow
export interface UnifiedChatOutput {
    reply: string;
    logs: FlowLog[];
    websiteAction: {
        type: 'youtube_search',
        query: string,
    } | null;
}

// Input for the intelligent fallback flow
export interface IntelligentFallbackInput {
    goal: string;
    prompt: string;
    config: AppConfig;
}

// Output from the intelligent fallback flow
export interface IntelligentFallbackOutput {
    recommendation: string;
    reasoning: string;
}

// Input for the setup assistant flow
export interface SetupAssistantInput {
    topic: string;
    question: string;
}

// Output from the setup assistant flow
export interface SetupAssistantOutput {
    answer: string;
}