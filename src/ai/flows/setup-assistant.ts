import type { SetupAssistantInput, SetupAssistantOutput } from '@/ai/types';

// This is a placeholder for the actual Genkit flow for the setup assistant.
// It provides hardcoded answers to common questions to simulate the feature.

export async function setupAssistantFlow(input: SetupAssistantInput): Promise<SetupAssistantOutput> {
    const { topic, question } = input;
    
    const lowerCaseQuestion = question.toLowerCase();

    // Generic answers based on topic
    const answers: { [key: string]: string } = {
        'Eden AI': "To get an Eden AI API key, you need to sign up on the Eden AI website, create a project, and then find your API key in your account dashboard. It allows you to access many different AI models through one API.",
        'Google AI': "You can get a Google AI API key from the Google AI Studio (formerly MakerSuite). Sign in with your Google account, create a new API key, and copy it. This key gives you access to Google's Gemini family of models.",
        'Discord': "For Discord, you need two things: a Bot Token and a Webhook URL. Create an application in the Discord Developer Portal to get a bot token (remember to enable Message Content Intent!). For the webhook, go to your server settings, then Integrations, and create a new webhook for the channel you want to post messages to.",
        'Twitch': "A Twitch Bot Token can be generated from services like TMI.js or other third-party sites that connect to the Twitch API. It's used to allow the bot to send messages in your chat.",
        'Streamer.bot': "Streamer.bot runs on your local computer. The server address is usually '127.0.0.1' (meaning 'this computer') and the port is configured in the Streamer.bot application under the 'Servers/Clients' tab. The default is often 8080, but 9003 is recommended for this app.",
    };

    if (lowerCaseQuestion.includes('where') || lowerCaseQuestion.includes('how')) {
         if (answers[topic]) {
            return { answer: answers[topic] };
         }
    }
    
    if (lowerCaseQuestion.includes('what is') || lowerCaseQuestion.includes('what\'s')) {
        return { answer: `The ${topic} configuration is for connecting Nexus Hub to that specific service. ${answers[topic] || ''}` };
    }


    return {
        answer: `I'm not sure how to answer that. For questions about ${topic}, please refer to their official documentation. My primary purpose is to help you locate where to find keys and tokens.`
    };
}
