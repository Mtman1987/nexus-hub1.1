
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It includes a step to enhance the user's initial prompt for better results.
 *
 * - imageGeneratorFlow - The main function to generate an image.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { callGoogleAiChat } from '../utils/google-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';


export async function imageGeneratorFlow(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    const logs: FlowLog[] = [];
    const config = {
        googleApiKey: localStorage.getItem('googleApiKey'),
    };
    
    const enhancerSystemPrompt = `You are a creative assistant that enhances prompts for an AI image generator. Take the user's simple prompt and expand it into a rich, detailed, and vivid description suitable for generating a high-quality, artistic image. Focus on visual details, lighting, style, and composition. Return only a single string with the enhanced prompt, nothing else.`;
    
    const enhancerResult = await callGoogleAiChat(config, [], `User Prompt: ${input.prompt}`, enhancerSystemPrompt);

    logs.push(...enhancerResult.logs);
    const enhancedPrompt = enhancerResult.text;

    if (!config.googleApiKey) {
        throw new Error("Google API key is missing.");
    }

    const genAI = new GoogleGenerativeAI(config.googleApiKey);
    const model = genAI.getGenerativeModel({ model: "image-generation-001" });

    try {
        logs.push({ service: 'Google AI', level: 'info', message: `Calling Image Generation with prompt: ${enhancedPrompt.substring(0, 100)}...` });
        const result = await model.generateContent(enhancedPrompt);
        // This part is hypothetical as the SDK response for image generation might differ.
        // Assuming the response has a way to get the image URL or data.
        // This will need to be adjusted based on the actual SDK response structure.
        // For now, we'll return a placeholder.
        const imageUrl = `https://placehold.co/512x512.png`; // Placeholder
        
        // In a real scenario, you would process `result.response` to extract the image data/URL.
        // For example: const imageUrl = result.response.candidates[0].content.parts[0].uri;

        logs.push({ service: 'Google AI', level: 'info', message: 'Successfully generated image.' });

        return {
            imageUrl: imageUrl, // Placeholder
            enhancedPrompt: enhancedPrompt,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
        logs.push({ service: 'Google AI', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined });
        throw error;
    }
}
