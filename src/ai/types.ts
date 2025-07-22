

import type { LogEntry } from "@/context/LogContext";
import { z } from 'zod';

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
    websiteAction: any | null; // Simplified for now
}

// --- Intelligent Fallback ---
export interface IntelligentFallbackInput {
    goal: string;
    prompt: string;
    config: AppConfig;
}

export interface IntelligentFallbackOutput {
    recommendation: string;
    reasoning: string;
}

// --- Setup Assistant ---
export interface SetupAssistantInput {
    topic: string;
    question: string;
    config: AppConfig;
}

export interface SetupAssistantOutput {
    answer: string;
}

// --- Lore Weaver ---
export interface LoreWeaverInput {
    prompt: string;
    config: AppConfig;
}

export interface LoreWeaverOutput {
    response: string;
}


// --- Image Generator ---
export interface ImageGeneratorInput {
    prompt: string;
    provider: string;
    resolution: string;
    numImages: number;
    optimize: boolean;
}

export interface ImageGeneratorOutput {
    images: { image_resource_url: string }[];
    enhancedPrompt?: string;
    selectedProvider: string;
    logs: FlowLog[];
}


// --- Lore Editor ---
export interface LoreEditorInput {
  currentDraft: string;
  userRequest: string;
}

export interface LoreEditorOutput {
  suggestion: string;
}


// --- Lore Curator ---
export type LoreEntry = {
  prompt: string;
  response: string;
};

export interface LoreCuratorInput {
  existingTimeline: LoreEntry[];
  newLore: LoreEntry;
}

export interface LoreCuratorOutput {
  sortedTimeline: LoreEntry[];
  personalityPrompt: string;
}


// --- Lore Summarizer ---
export interface LoreSummarizerInput {
  timeline: LoreEntry[];
}

export interface LoreSummarizerOutput {
  personalityPrompt: string;
}

// --- TTS ---
export const TtsInputSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
});
export type TtsInput = z.infer<typeof TtsInputSchema>;

export const TtsOutputSchema = z.object({
  media: z.string().describe("The audio data URI."),
  logs: z.any()
});
export type TtsOutput = z.infer<typeof TtsOutputSchema>;

// --- Resume Parser ---
export interface ResumeParserInput {
    fileUrl: string;
}

export interface ResumeParserOutput {
    status: string;
    extracted_data: {
        personal_infos: {
            name: {
                raw_name: string;
            };
            address: {
                raw_address: string;
            };
            self_summary: string;
            phones: string[];
            mails: string[];
            websites: string[];
            skills: { name: string, type: string }[];
        },
        education: {
            entries: {
                title: string | null;
                start_date: string;
                end_date: string;
                location: {
                    raw_location: string;
                },
                establishment: string;
                description: string | null;
            }[]
        },
        work_experience: {
            entries: {
                title: string | null;
                start_date: string;
                end_date: string;
                company: string;
                location: {
                    raw_location: string;
                },
                description: string | null;
            }[]
        }
    }
}


// --- Translation ---
export interface TranslationInput {
    text: string;
    provider: string;
    sourceLang: string;
    targetLang: string;
}

export interface TranslationOutput {
    text: string;
    status: string;
}

// --- Speech to Text ---
export interface SpeechToTextInput {
    file: File;
    provider: string;
    language: string;
}

export interface SpeechToTextOutput {
    text: string;
}

// --- Code Generator ---
export interface CodeGeneratorInput {
    instruction: string;
    prompt?: string; // Optional context
    language: string;
    config: AppConfig;
}

export interface CodeGeneratorOutput {
    generated_code: string;
}


// --- Video Generator ---
export interface VideoGeneratorInput {
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    durationSeconds: number;
}

export interface VideoGeneratorOutput {
    video: {
        url: string; // The data URI of the video
        contentType: string; // e.g., 'video/mp4'
    };
    logs: FlowLog[];
}
