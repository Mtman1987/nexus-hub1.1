
/**
 * @fileoverview This file initializes the Genkit AI platform with necessary plugins.
 * It exports a configured `ai` object that is used throughout the application
 * to define and run AI flows.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { googleCloud } from '@genkit-ai/google-cloud';

// Initialize Genkit with plugins for Google AI (for Gemini models)
// and Google Cloud (for logging and tracing).
// This is the correct syntax for Genkit v1.x.
export const ai = genkit({
  plugins: [
    googleAI(),
    googleCloud,
  ],
});
