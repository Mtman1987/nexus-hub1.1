
'use server';
/**
 * @fileOverview A flow for converting text to speech via Genkit.
 *
 * - ttsFlow - The main function to convert text to a playable audio data URI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

import { TtsInputSchema, TtsOutputSchema, type TtsInput, type TtsOutput } from '../types';
import { googleAI } from '@genkit-ai/googleai';


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function textToSpeech(input: TtsInput): Promise<TtsOutput> {
    return ttsFlow(input);
}


const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TtsInputSchema,
    outputSchema: TtsOutputSchema,
  },
  async (input) => {
    try {
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: input.voice || 'Algenib' },
                  },
                },
            },
            prompt: input.text,
        });

        if (!media) {
          throw new Error('No media was returned from the TTS service.');
        }

        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );
        
        const wavData = await toWav(audioBuffer);

        return {
            media: 'data:audio/wav;base64,' + wavData,
            logs: [{ service: 'TTS', level: 'info', message: 'Successfully generated audio via Genkit.' }]
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during TTS generation.";
        console.error("TTS Flow Error:", error);
        return {
            media: '',
            logs: [{ service: 'TTS', level: 'error', message: errorMessage, details: error instanceof Error ? error.stack : undefined }]
        };
    }
  }
);
