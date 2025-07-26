'use server';
/**
 * @fileOverview A flow for safely reading the filenames of available components
 * from the 'finished_code' sandbox directory.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const GetSandboxComponentsOutputSchema = z.object({
  components: z.array(z.string()).describe("A list of component filenames."),
});
export type GetSandboxComponentsOutput = z.infer<typeof GetSandboxComponentsOutputSchema>;

// This function will be called from the UI component.
export async function getSandboxComponents(): Promise<GetSandboxComponentsOutput> {
  return getSandboxComponentsFlow();
}

const getSandboxComponentsFlow = ai.defineFlow(
  {
    name: 'getSandboxComponentsFlow',
    outputSchema: GetSandboxComponentsOutputSchema,
  },
  async () => {
    try {
      const componentsDir = path.resolve(process.cwd(), 'src/components/sandbox/finished_code');
      const files = await fs.readdir(componentsDir);

      // Filter for .tsx files and remove the extension for cleaner display names.
      const componentFiles = files
        .filter(file => file.endsWith('.tsx'))
        .filter(file => file !== 'placeholder.ts'); // Exclude placeholder

      return {
        components: componentFiles,
      };
    } catch (error) {
      // If the directory doesn't exist, return an empty array gracefully.
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return { components: [] };
      }
      console.error("Error in getSandboxComponentsFlow:", error);
      // For other errors, rethrow them.
      throw error;
    }
  }
);
