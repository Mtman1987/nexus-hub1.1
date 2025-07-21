

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
    config: z.any(), // Pass config for the AI call
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

// --- Lore Weaver ---
export const LoreWeaverInputSchema = z.object({
    prompt: z.string(),
    config: z.any(),
});
export type LoreWeaverInput = z.infer<typeof LoreWeaverInputSchema>;

export const LoreWeaverOutputSchema = z.object({
    response: z.string(),
});
export type LoreWeaverOutput = z.infer<typeof LoreWeaverOutputSchema>;

// --- Image Generator ---
export const ImageGeneratorInputSchema = z.object({
    prompt: z.string(),
});
export type ImageGeneratorInput = z.infer<typeof ImageGeneratorInputSchema>;

export const ImageGeneratorOutputSchema = z.object({
    imageUrl: z.string(),
    enhancedPrompt: z.string(),
});
export type ImageGeneratorOutput = z.infer<typeof ImageGeneratorOutputSchema>;

// --- Lore Editor ---
export const LoreEditorInputSchema = z.object({
  currentDraft: z.string().describe("The user's current version of the lore entry."),
  userRequest: z.string().describe("The user's specific question or request for help with the draft.")
});
export type LoreEditorInput = z.infer<typeof LoreEditorInputSchema>;

export const LoreEditorOutputSchema = z.object({
  suggestion: z.string().describe("The AI's creative suggestion to help the user improve their draft.")
});
export type LoreEditorOutput = z.infer<typeof LoreEditorOutputSchema>;


// --- Lore Curator ---
const LoreEntrySchema = z.object({
  prompt: z.string(),
  response: z.string(),
});

export const LoreCuratorInputSchema = z.object({
  existingTimeline: z.array(LoreEntrySchema).describe("The current timeline of lore entries, in chronological order."),
  newLore: LoreEntrySchema.describe("The new lore entry to be added to the timeline.")
});
export type LoreCuratorInput = z.infer<typeof LoreCuratorInputSchema>;

export const LoreCuratorOutputSchema = z.object({
  sortedTimeline: z.array(LoreEntrySchema).describe("The complete, re-sorted timeline including the new entry in its correct chronological position.")
});
export type LoreCuratorOutput = z.infer<typeof LoreCuratorOutputSchema>;
