
'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It includes a step to enhance the user's initial prompt for better results.
 *
 * - imageGeneratorFlow - The main function to generate an image.
 */
import type { ImageGeneratorInput, ImageGeneratorOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat, callEdenAiImage } from '../utils/eden-ai';


export async function imageGeneratorFlow(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    const logs: FlowLog[] = [];
    const config = {
        edenApiKey: localStorage.getItem('edenApiKey'),
        // Use a standard model for enhancing the prompt
        edenAiProvider: 'openai',
        edenAiModel: 'gpt-4-turbo'
    };
    
    const enhancerSystemPrompt = `You are a creative assistant that enhances prompts for an AI image generator. Take the user's simple prompt and expand it into a rich, detailed, and vivid description suitable for generating a high-quality, artistic image. Focus on visual details, lighting, style, and composition. Return only a single string with the enhanced prompt, nothing else.`;
    
    const enhancerResult = await callEdenAiChat(config, [
        { role: 'system', text: enhancerSystemPrompt },
        { role: 'user', text: `User Prompt: ${input.prompt}` }
    ]);

    logs.push(...enhancerResult.logs);
    const enhancedPrompt = enhancerResult.text;
    
    const imageConfig = {
        edenApiKey: localStorage.getItem('edenApiKey'),
        // Image generation often works best with specific providers
        edenAiProvider: 'openai',
        edenAiModel: 'dall-e-3' // A powerful image model
    };

    const imageResult = await callEdenAiImage(imageConfig, enhancedPrompt, logs);
    
    return {
      imageUrl: imageResult.imageUrl,
      enhancedPrompt: enhancedPrompt,
    };
}
