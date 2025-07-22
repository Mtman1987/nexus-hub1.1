/**
 * @fileoverview This file initializes the Genkit AI platform with necessary plugins.
 * It exports a configured `ai` object that is used throughout the application
 * to define and run AI flows.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase/v1';
import { googleCloud } from '@genkit-ai/google-cloud';

// Initialize Genkit with plugins for Google AI (for Gemini models),
// Firebase (for the bot personality store), and Google Cloud (for logging and tracing).
export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(),
    googleCloud(),
  ],
  // Log all AI requests and responses to the console for debugging.
  logLevel: 'debug',
  // Enable production-grade telemetry for monitoring.
  enableTracingAndMetrics: true,
});
