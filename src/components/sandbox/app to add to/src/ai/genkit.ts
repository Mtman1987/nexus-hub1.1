
/**
 * @fileoverview This file initializes the Genkit AI platform with necessary plugins.
 * It exports a configured `ai` object that is used throughout the application
 * to define and run AI flows.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin for Gemini models.
// The googleCloud plugin has been temporarily removed to resolve a build issue.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
