
'use server';
/**
 * @fileOverview A flow for generating video from a text prompt using Veo.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import type { VideoGeneratorInput, VideoGeneratorOutput, FlowLog } from '../types';

async function toBase64(url: string): Promise<string> {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${url}&key=${process.env.GOOGLE_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video data: ${response.statusText}`);
        }
        const buffer = await response.buffer();
        return buffer.toString('base64');
    } catch(e) {
        console.error("Error fetching or converting video to base64", e);
        throw e;
    }
}

export async function videoGeneratorFlow(input: VideoGeneratorInput): Promise<VideoGeneratorOutput> {
    const logs: FlowLog[] = [];
    
    try {
        logs.push({ service: 'Video Generation', level: 'info', message: 'Starting Veo video generation process...' });

        let { operation } = await ai.generate({
            model: googleAI.model('veo-2.0-generate-001'),
            prompt: input.prompt,
            config: {
                durationSeconds: input.durationSeconds,
                aspectRatio: input.aspectRatio,
            },
        });

        if (!operation) {
            throw new Error('Expected the model to return an operation');
        }

        logs.push({ service: 'Video Generation', level: 'info', message: 'Video generation job submitted. Polling for completion...', details: `Operation Name: ${operation.name}` });

        while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
            operation = await ai.checkOperation(operation);
            logs.push({ service: 'Video Generation', level: 'info', message: `Polling... Operation status: ${operation.done ? 'done' : 'running'}` });
        }

        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const videoPart = operation.output?.message?.content.find((p) => !!p.media);
        if (!videoPart || !videoPart.media) {
            throw new Error('Failed to find the generated video in the operation result.');
        }

        logs.push({ service: 'Video Generation', level: 'info', message: 'Video generated successfully. Converting to data URI.' });
        
        const videoBase64 = await toBase64(videoPart.media.url);
        const contentType = videoPart.media.contentType || 'video/mp4';
        const dataUri = `data:${contentType};base64,${videoBase64}`;

        return {
            video: {
                url: dataUri,
                contentType: contentType,
            },
            logs,
        };

    } catch (e) {
        const error = e as Error;
        logs.push({ service: 'Video Generation', level: 'error', message: `An error occurred: ${error.message}`, details: error.stack });
        throw error; // Re-throw the error to be caught by the service layer
    }
}
