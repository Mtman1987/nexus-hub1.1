'use server';
/**
 * @fileOverview An AI flow for saving generated code to a sandbox file.
 * In this case, we aren't using an AI, but we use the flow structure
 * to safely handle file system operations from a server action.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const SaveToSandboxInputSchema = z.object({
  code: z.string().describe("The TypeScript/TSX code to be saved."),
  filePath: z.string().describe("The relative path within the project to save the file to."),
});
export type SaveToSandboxInput = z.infer<typeof SaveToSandboxInputSchema>;

const SaveToSandboxOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SaveToSandboxOutput = z.infer<typeof SaveToSandboxOutputSchema>;

// This function will be called from the UI component.
export async function saveToSandbox(input: SaveToSandboxInput): Promise<SaveToSandboxOutput> {
  return saveToSandboxFlow(input);
}

const saveToSandboxFlow = ai.defineFlow(
  {
    name: 'saveToSandboxFlow',
    inputSchema: SaveToSandboxInputSchema,
    outputSchema: SaveToSandboxOutputSchema,
  },
  async (input) => {
    try {
      // IMPORTANT: Ensure the file path is safe and restricted to the sandbox directory.
      if (!input.filePath.startsWith('src/components/sandbox/')) {
        throw new Error("Invalid file path. Can only write to 'src/components/sandbox/'.");
      }
      
      const absolutePath = path.resolve(process.cwd(), input.filePath);
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });

      await fs.writeFile(absolutePath, input.code, 'utf8');

      return {
        success: true,
        message: `Successfully saved code to ${input.filePath}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Error in saveToSandboxFlow:", error);
      return {
        success: false,
        message: `Failed to save file: ${errorMessage}`,
      };
    }
  }
);
