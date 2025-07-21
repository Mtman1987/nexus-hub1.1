// This flow is the central nervous system of the application.
// It receives a user's message, their intended targets, and all current app configuration.
// It then decides which actions to take, which AI to call, and what to send back.

import type { UnifiedChatInput, UnifiedChatOutput, FlowLog } from '@/ai/types';

// A mock function to simulate calling an AI model.
// In a real Genkit app, this would use `ai.generate()` and `ai.prompt()`.
async function mockAiCall(prompt: string, provider: string): Promise<{ reply: string, success: boolean, log: FlowLog }> {
    return new Promise(resolve => {
        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% success rate
            if (success) {
                resolve({
                    reply: `(Mock reply from ${provider}) You said: "${prompt}"`,
                    success: true,
                    log: { service: provider, level: 'info', message: `Successfully generated reply for prompt: "${prompt.substring(0, 30)}..."` }
                });
            } else {
                resolve({
                    reply: '',
                    success: false,
                    log: { service: provider, level: 'error', message: `Mock API call failed for provider: ${provider}` }
                });
            }
        }, 500);
    });
}

// A mock function to simulate sending a webhook.
async function mockWebhookCall(url: string, body: object): Promise<FlowLog> {
    console.log(`Simulating webhook to ${url} with body:`, body);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ service: 'System', level: 'info', message: `Webhook sent to ${url.substring(0, 30)}...` });
        }, 200);
    });
}


export async function unifiedChatFlow(input: UnifiedChatInput): Promise<UnifiedChatOutput> {
    const { message, targets, config, nexusConnectTargets } = input;
    const logs: FlowLog[] = [];
    let aiReply = '';
    let websiteAction: UnifiedChatOutput['websiteAction'] = null;

    // 1. Handle non-AI targets first
    if (targets.includes('Discord') && config.discordWebhook) {
        logs.push(await mockWebhookCall(config.discordWebhook, { content: message, username: config.botName || 'Nexus Hub' }));
    }
    if (targets.includes('Streamer.bot') && config.streamerbotServerAddress && config.streamerbotServerPort) {
        // In a real app, this would use a WebSocket client to connect to Streamer.bot
        logs.push({ service: 'Streamer.bot', level: 'info', message: `Message sent to Streamer.bot: "${message}"` });
    }
    if (targets.includes('Nexus Connect') && nexusConnectTargets && nexusConnectTargets.length > 0) {
        for (const url of nexusConnectTargets) {
            logs.push(await mockWebhookCall(url, { content: message, author: config.botName || 'Nexus Hub' }));
        }
    }
    
    // 2. Handle Website Control commands
    const websiteCommandMatch = message.match(/^(search youtube for|youtube search|yt search)\s+(.+)/i);
    if (targets.includes('Website') && websiteCommandMatch && websiteCommandMatch[2]) {
        const query = websiteCommandMatch[2].trim();
        websiteAction = { type: 'youtube_search', query };
        logs.push({ service: 'Website Control', level: 'info', message: `Performing YouTube search for: "${query}"`});
        aiReply = `Searching YouTube for "${query}"...`;
    }


    // 3. Handle AI Bot target with fallback logic
    if (targets.includes('AI Bot') && !websiteAction) {
        const providerOrder = config.fallbackStrategy || ['eden', 'google', 'openai', 'groq'];
        const enabledProviders = config.providerStatus || { eden: 'enabled', google: 'enabled', openai: 'enabled', groq: 'enabled' };
        
        const systemPrompt = config.botPersonalityPrompt || 'You are a helpful assistant.';
        const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

        let success = false;
        for (const provider of providerOrder) {
            const hasKey = !!config[`${provider}ApiKey`];
            const isEnabled = enabledProviders[provider] !== 'disabled';

            if (hasKey && isEnabled && !success) {
                const result = await mockAiCall(fullPrompt, provider);
                logs.push(result.log);
                if (result.success) {
                    aiReply = result.reply;
                    success = true;
                }
            }
        }
        if (!success) {
            aiReply = "I'm sorry, but all available AI providers failed. Please check your API keys and settings in the API Key Vault.";
            logs.push({ service: 'System', level: 'error', message: 'All AI providers failed.' });
        }
    }

    return {
        reply: aiReply,
        logs: logs,
        websiteAction: websiteAction
    };
}
