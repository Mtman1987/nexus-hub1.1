
'use server';
/**
 * @fileOverview An AI flow for parsing resumes from a URL.
 *
 * - resumeParserFlow - The main function to parse a resume.
 */
import type { ResumeParserInput, ResumeParserOutput, FlowLog } from '@/ai/types';
import { AppConfig } from '@/ai/types';

async function callEdenAiResumeParser(
    config: AppConfig,
    fileUrl: string
): Promise<{ result: ResumeParserOutput, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    logs.push({ service: 'Eden', level: 'info', message: `Parsing resume from URL...` });
    
    const url = "https://api.edenai.run/v2/ocr/resume_parser";
    const payload = {
        providers: "google", // Use a single, reliable provider for consistency
        file_url: fileUrl,
        fallback_providers: "" // No fallback needed when specifying one provider
    };
    const headers = { "Authorization": `Bearer ${config.edenApiKey}`, "Content-Type": "application/json" };

    try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Resume Parser failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        
        const parsedData = result['google'];

        if (!parsedData || parsedData.status !== 'success') {
           throw new Error(parsedData?.error?.message || "An unknown error occurred during parsing.");
        }

        logs.push({ service: 'Eden', level: 'info', message: 'Successfully parsed resume.' });
        return { result: parsedData as ResumeParserOutput, logs };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during resume parsing.";
        logs.push({ service: 'Eden', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function resumeParserFlow(input: ResumeParserInput): Promise<{response: ResumeParserOutput, logs: FlowLog[]}> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    const { fileUrl } = input;
    
    const { result, logs } = await callEdenAiResumeParser(config, fileUrl);

    return {
        response: result,
        logs: logs,
    };
}
