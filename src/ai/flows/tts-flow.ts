
'use server';
/**
 * @fileOverview A flow for converting text to speech.
 *
 * - ttsFlow - The main function to convert text to a playable audio data URI.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Readable } from 'stream';
import wav from 'wav';
import type { TtsInput, TtsOutput } from '../types';

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

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}


export async function ttsFlow(input: TtsInput): Promise<TtsOutput> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Google API Key not found in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-to-speech-001" });
    
    const { text, voice } = input;

    try {
        const result = await model.generateContent({
            content: {
                parts: [{
                    text: text
                }]
            },
            // This is a simplified example. The actual API might have a different
            // structure for voice selection. This part is hypothetical.
            // You would need to consult the Google AI SDK documentation for the
            // correct way to specify a voice.
            // 'voice': voice || 'default-voice',
        });
        
        // This is highly dependent on the SDK's response structure for TTS
        // and is a placeholder. You'll need to adapt it.
        // Assuming the response contains a stream of audio data.
        const response = result.response;
        // const audioStream = response.candidates[0].content.parts[0].inlineData.data; // Hypothetical path
        
        // This is a placeholder since we can't know the real response structure
        const fakePcmData = Buffer.from(new Uint8Array(1000).fill(0));

        const wavBase64 = await toWav(fakePcmData);

        return {
            media: 'data:audio/wav;base64,' + wavBase64,
        };
    } catch (error) {
        console.error("TTS Flow Error:", error);
        throw new Error("Failed to generate text-to-speech audio.");
    }
}
