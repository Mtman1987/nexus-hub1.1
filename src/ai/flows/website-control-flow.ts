
'use server';
/**
 * @fileOverview An AI flow that translates natural language commands into website actions,
 * specifically YouTube search queries for this implementation.
 *
 * - websiteControl - The main function to process the command.
 */
import { callAIChat } from '@/ai/utils';
import { z } from 'zod';
import { type WebsiteControlInput, WebsiteControlOutputSchema, type WebsiteControlOutput, FlowLog } from '@/ai/types';

export async function websiteControl(input: WebsiteControlInput): Promise<WebsiteControlOutput> {
  const systemPrompt = `You are a helpful assistant that converts user commands into search queries for YouTube.
  
  Take the user's command and turn it into a concise and effective search query. For example, if the user says "play the latest news headlines", the query could be "latest news headlines". If they say "show me how to cook lasagna", the query could be "how to cook lasagna".

  User command: "${input.command}"
  
  Output your response as a JSON object with a single key: "searchQuery".`;
  
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
