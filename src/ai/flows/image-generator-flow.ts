'use server';
/**
 * @fileOverview An AI flow for generating images from a text prompt.
 * It includes a step to enhance the user's initial prompt for better results.
 *
 * - imageGeneratorFlow - The main function to generate an image.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ImageGeneratorInputSchema, ImageGeneratorOutputSchema, type ImageGeneratorInput, type ImageGeneratorOutput } from '@/ai/types';

const promptEnhancer = ai.definePrompt({
    name: 'promptEnhancer',
    input: { schema: z.object({ prompt: z.string() }) },
    output: { schema: z.object({ enhancedPrompt: z.string() }) },
    prompt: `You are a creative assistant that enhances prompts for an AI image generator. 
    Take the user's simple prompt and expand it into a rich, detailed, and vivid description suitable for generating a high-quality, artistic image. 
    Focus on visual details, lighting, style, and composition.

    User Prompt: {{{prompt}}}
    
    Return only the JSON object with the enhanced prompt.`,
    config: {
        model: 'googleai/gemini-1.5-flash-latest'
    }
});

const imageGenerator = ai.defineTool(
  {
    name: 'imageGenerator',
    description: 'Generates an image based on a detailed text prompt.',
    inputSchema: z.object({
        prompt: z.string().describe('A detailed prompt for the image generation model.'),
    }),
    outputSchema: z.object({
        imageUrl: z.string().describe('The data URI of the generated image.'),
    }),
  },
  async (input) => {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });
    if (!media.url) {
        throw new Error('Image generation failed to return an image.');
    }
    return { imageUrl: media.url };
  }
);


const imageGeneratorFlowBare = ai.defineFlow(
  {
    name: 'imageGeneratorFlow',
    inputSchema: ImageGeneratorInputSchema,
    outputSchema: ImageGeneratorOutputSchema,
  },
  async (input) => {
    const { output: enhanced } = await promptEnhancer({ prompt: input.prompt });
    if (!enhanced?.enhancedPrompt) {
        throw new Error('Failed to get an enhanced prompt from the AI.');
    }
    
    const imageResult = await imageGenerator({ prompt: enhanced.enhancedPrompt });

    return {
      imageUrl: imageResult.imageUrl,
      enhancedPrompt: enhanced.enhancedPrompt,
    };
  }
);

export async function imageGeneratorFlow(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
    return imageGeneratorFlowBare(input);
}
