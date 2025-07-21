
'use server';
/**
 * @fileOverview An AI flow that translates natural language commands into website actions,
 * specifically YouTube search queries or song additions for this implementation.
 *
 * - websiteControl - The main function to process the command.
 */
import { callAIChat } from '@/ai/utils';
import { z } from 'zod';
import { type WebsiteControlInput, WebsiteControlOutputSchema, type WebsiteControlOutput, FlowLog } from '@/ai/types';

export async function websiteControl(input: WebsiteControlInput): Promise<WebsiteControlOutput> {
  const systemPrompt = `You are a helpful assistant that converts user commands into structured actions for a website viewer that primarily displays YouTube. You can perform two main actions: searching YouTube, or adding a YouTube song to a playlist.

Analyze the user's command.

1. If the command is a general request to find or show something (e.g., "show me how to cook lasagna", "find the latest news"), convert it into a concise and effective search query. The action should be 'youtube_search'.

2. If the command explicitly mentions adding a song/video to a playlist AND includes a YouTube URL (e.g., "add this song to my playlist https://www.youtube.com/watch?v=dQw4w9WgXcQ"), your action should be 'add_youtube_song'. Extract the full URL.

User command: "${input.command}"
  
Output your response as a JSON object with two keys: "action" (which can be "youtube_search" or "add_youtube_song") and "payload" (which will be the search query string for a search, or the full URL for adding a song).`;
  
  const { response, logs } = await callAIChat({
      userMessage: input.command,
      systemPrompt: systemPrompt,
      jsonMode: true,
  });

  try {
      const parsedResponse = WebsiteControlOutputSchema.parse(response);
      return parsedResponse;
  } catch (error) {
      console.error("Failed to parse website control response:", error);
      throw new Error("The AI returned an invalid JSON format for the website control command.");
  }
}
