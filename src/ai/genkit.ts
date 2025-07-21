import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { logger } from 'genkit/logging';
import { z } from 'zod';

export const ai = genkit({
    plugins: [
        googleAI({
            apiVersion: ['v1', 'v1beta'],
        }),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});
