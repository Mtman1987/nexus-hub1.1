
'use server';
/**
 * @fileOverview This file is the single entry point for all AI service calls.
 * It provides a consistent interface for components to interact with AI flows.
 */

import { intelligentFallbackFlow } from '@/ai/flows/intelligent-fallback';
import { setupAssistantFlow } from '@/ai/flows/setup-assistant-flow';
import { unifiedChatFlow } from '@/ai/flows/unified-chat-flow';
import { loreWeaverFlow } from '@/ai/flows/lore-weaver';
import { imageGeneratorFlow } from '@/ai/flows/image-generator-flow';
import { loreEditorFlow } from '@/ai/flows/lore-editor-flow';
import { loreCuratorFlow } from '@/ai/flows/lore-curator-flow';
import { loreSummarizerFlow } from '@/ai/flows/lore-summarizer-flow';
import { resumeParserFlow } from '@/ai/flows/resume-parser-flow';
import { translationFlow } from '@/ai/flows/translation-flow';
import { speechToTextFlow } from '@/ai/flows/speech-to-text-flow';
import { ttsFlow } from '@/ai/flows/tts-flow';
import { codeGeneratorFlow } from '@/ai/flows/code-generator-flow';
import { videoGeneratorFlow } from '@/ai/flows/video-generator-flow';
import { getSandboxComponents as getSandboxComponentsFlow } from '@/ai/flows/get-sandbox-components-flow';


import type { FlowLog, SetupAssistantInput, SetupAssistantOutput, UnifiedChatInput, UnifiedChatOutput } from '@/ai/types';
import type { LoreWeaverInput, LoreWeaverOutput } from '@/ai/types';
import type { ImageGeneratorInput, ImageGeneratorOutput } from '@/ai/types';
import type { LoreEditorInput, LoreEditorOutput } from '@/ai/types';
import type { LoreCuratorInput, LoreCuratorOutput } from '@/ai/types';
import type { LoreSummarizerInput, LoreSummarizerOutput } from '@/ai/types';
import type { TtsInput, TtsOutput } from '@/ai/types';
import type { ResumeParserInput, ResumeParserOutput } from '@/ai/types';
import type { TranslationInput, TranslationOutput, SpeechToTextInput, SpeechToTextOutput } from '@/ai/types';
import type { CodeGeneratorInput, CodeGeneratorOutput } from '@/ai/types';
import type { VideoGeneratorInput, VideoGeneratorOutput } from '@/ai/types';
import { GetSandboxComponentsOutput } from '@/ai/flows/get-sandbox-components-flow';


/**
 * Main service function to handle unified chat requests.
 */
export async function unifiedChat(input: UnifiedChatInput): Promise<UnifiedChatOutput> {
    return unifiedChatFlow(input);
}

/**
 * Service function to generate a code snippet.
 */
export async function getCodeGeneration(input: CodeGeneratorInput): Promise<{response: CodeGeneratorOutput, logs: FlowLog[]}> {
    return codeGeneratorFlow(input);
}


/**
 * Main service function to get help from the setup assistant.
 */
export async function getSetupAssistantResponse(input: SetupAssistantInput): Promise<{response: SetupAssistantOutput, logs: FlowLog[]}> {
    return setupAssistantFlow(input);
}

/**
 * Main service function to get a lore response from the Lore Weaver.
 */
export async function getLoreWeaverResponse(input: LoreWeaverInput): Promise<{response: LoreWeaverOutput, logs: FlowLog[]}> {
    return loreWeaverFlow(input);
}

/**
 * Main service function to generate an image from a prompt.
 */
export async function generateImage(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    return imageGeneratorFlow(input);
}

/**
 * Service function to get creative help when editing lore.
 */
export async function getLoreEditorSuggestion(input: LoreEditorInput): Promise<LoreEditorOutput> {
    return loreEditorFlow(input);
}

/**
 * Service function to have the AI sort and place a new entry into the timeline.
 */
export async function getCuratedTimeline(input: LoreCuratorInput): Promise<LoreCuratorOutput> {
    return loreCuratorFlow(input);
}

/**
 * Service function to summarize the timeline into a bot personality.
 */
export async function getSummarizedPersonality(input: LoreSummarizerInput): Promise<LoreSummarizerOutput> {
    return loreSummarizerFlow(input);
}

/**
 * Service function to convert text to speech.
 */
export async function getTTSAudio(input: TtsInput): Promise<{response: TtsOutput, logs: FlowLog[]}> {
    return ttsFlow(input);
}

/**
 * Service function to parse a resume from a URL.
 */
export async function getParsedResume(input: ResumeParserInput): Promise<{response: ResumeParserOutput, logs: FlowLog[]}> {
    return resumeParserFlow(input);
}

/**
 * Service function to translate text.
 */
export async function getTranslation(input: TranslationInput): Promise<{response: TranslationOutput, logs: FlowLog[]}> {
    return translationFlow(input);
}

/**
 * Service function to transcribe an audio file.
 */
export async function getTranscription(input: SpeechToTextInput): Promise<{response: SpeechToTextOutput, logs: FlowLog[]}> {
    return speechToTextFlow(input);
}

/**
 * Service function to generate a video from a prompt.
 */
export async function generateVideo(input: VideoGeneratorInput): Promise<VideoGeneratorOutput> {
    return videoGeneratorFlow(input);
}

/**
 * Service function to get the list of available sandbox components.
 */
export async function getSandboxComponents(): Promise<GetSandboxComponentsOutput> {
    return getSandboxComponentsFlow();
}
