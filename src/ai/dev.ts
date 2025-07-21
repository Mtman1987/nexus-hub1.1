import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-daily-progress.ts';
import '@/ai/flows/generate-starting-prompts.ts';
import '@/ai/flows/suggest-improvements.ts';