
'use server';
/**
 * @fileOverview A flow for generating video from a text prompt using Eden AI's async API.
 * It now supports optional image-to-video generation.
 */
import type { VideoGeneratorInput, VideoGeneratorOutput, FlowLog, AppConfig } from '../types';

async function pollForResult(jobId: string, config: AppConfig): Promise<any> {
    const url = `https://api.edenai.run/v2/video/generation_async/${jobId}`;
    const headers = { "Authorization": `Bearer ${config.edenApiKey}` };
    
    // Poll every 10 seconds for 5 minutes
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const response = await fetch(url, { headers });
        if (!response.ok) {
            // If the job is not found, it might still be processing, so we continue
            if (response.status === 404) continue;
            throw new Error(`Polling failed with status ${response.status}`);
        }
        const result = await response.json();
        if (result.status === 'succeeded') {
            return result;
        }
        if (result.status === 'failed') {
            throw new Error(`Video generation job failed: ${result.error?.message || 'Unknown error'}`);
        }
    }
    throw new Error('Video generation timed out after 5 minutes.');
}


async function callEdenAiVideo(
    config: AppConfig,
    input: VideoGeneratorInput,
): Promise<{ result: VideoGeneratorOutput, logs: FlowLog[] }> {
    const logs: FlowLog[] = [];
    if (!config.edenApiKey) {
        throw new Error("Eden AI API key is not configured.");
    }
    
    logs.push({ service: 'Eden Video', level: 'info', message: `Submitting video generation job with provider ${input.provider}...` });
    
    const url = "https://api.edenai.run/v2/video/generation_async";
    
    const formData = new FormData();
    formData.append('providers', input.provider);
    formData.append('text', input.prompt);
    formData.append('fallback_providers', ''); // Ensure no unexpected fallbacks
    
    if (input.image) {
        formData.append('file', input.image);
        logs.push({ service: 'Eden Video', level: 'info', message: 'Image file included for image-to-video generation.'});
    }

    const headers = { 
        "Authorization": `Bearer ${config.edenApiKey}`,
    };

    try {
        const initialResponse = await fetch(url, { method: 'POST', body: formData, headers });
        if (!initialResponse.ok) {
            const errorBody = await initialResponse.text();
            throw new Error(`Video job submission failed with status ${initialResponse.status}: ${errorBody}`);
        }
        const initialResult = await initialResponse.json();

        if (!initialResult.public_id) { // Eden async returns public_id now
            throw new Error(`Eden AI did not return a job ID. Response: ${JSON.stringify(initialResult)}`);
        }
        
        const jobId = initialResult.public_id;
        logs.push({ service: 'Eden Video', level: 'info', message: `Job submitted successfully (ID: ${jobId}). Polling for result...` });

        const finalResult = await pollForResult(jobId, config);
        
        const videoUrl = finalResult.results[input.provider]?.video_resource_url;
        if (!videoUrl) {
            throw new Error("Could not find video URL in the final result.");
        }
        
        logs.push({ service: 'Eden Video', level: 'info', message: 'Successfully generated video.' });
        return { 
            result: { 
                video: {
                    url: videoUrl,
                    contentType: 'video/mp4' // Assuming mp4
                }
            }, 
            logs 
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during video generation.";
        logs.push({ service: 'Eden Video', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}


export async function videoGeneratorFlow(input: VideoGeneratorInput): Promise<VideoGeneratorOutput> {
    const config: AppConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
    };
    
    const { result, logs } = await callEdenAiVideo(config, input);

    return {
        ...result,
        logs,
    };
}
