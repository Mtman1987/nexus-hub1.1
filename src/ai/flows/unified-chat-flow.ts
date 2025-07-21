
'use server';
/**
 * @fileOverview A flow for handling messages from the Unified Chat component.
 * It can route messages to different services like Discord or an internal AI chat.
 *
 * - unifiedChat - The main function to handle chat messages.
 */
import { callAIChat } from '@/services/ai';
import type { LogEntry } from '@/context/LogContext';
import { type UnifiedChatInput, type UnifiedChatOutput, type FlowLog } from '@/ai/types';
import { websiteControl } from './website-control-flow';

async function sendToDiscordWebhook(webhookUrl: string, message: string, username: string) {
    try {
        const payload = { content: message, username };
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Discord webhook failed with status ${response.status}: ${errorText}`);
        }
        return { service: 'Discord', level: 'info', message: `Successfully sent message to Discord webhook.` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { service: 'Discord', level: 'error', message: `Failed to send message: ${errorMessage}`, details: error instanceof Error ? error.stack : undefined };
    }
}

async function sendToStreamerBot(config: UnifiedChatInput['config'], message: string) {
     try {
        const {
            streamerbotServerAddress: address,
            streamerbotServerPort: port,
            streamerbotRequestType: requestType = 'DoAction',
            streamerbotActionName: actionName,
            streamerbotVariableName: variableName,
        } = config || {};

        if (!address || !port) {
            throw new Error("Streamer.bot address or port is not configured.");
        }

        let payloadBody: any = {};
        let successMessage = '';

        switch (requestType) {
            case 'DoAction':
                if (!actionName) throw new Error("Action Name is required for 'Do Action' request.");
                payloadBody = {
                    request: "DoAction",
                    action: { name: actionName },
                    args: { message: message },
                    id: `nexus-hub-do-action-${Date.now()}`
                };
                successMessage = `Successfully sent action '${actionName}' to Streamer.bot.`;
                break;

            case 'BroadcastMessage':
                payloadBody = {
                    request: "BroadcastMessage",
                    message: message,
                    id: `nexus-hub-broadcast-${Date.now()}`
                };
                successMessage = `Successfully broadcasted message via Streamer.bot.`;
                break;

            case 'SetGlobalVariable':
                if (!variableName) throw new Error("Variable Name is required for 'Set Global Variable' request.");
                payloadBody = {
                    request: "SetGlobal",
                    name: variableName,
                    value: message,
                    id: `nexus-hub-set-global-${Date.now()}`
                };
                successMessage = `Successfully set global variable '${variableName}'.`;
                break;

            default:
                throw new Error(`Unsupported Streamer.bot request type: ${requestType}`);
        }
        
        const url = `http://${address}:${port}/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'NexusHub/1.0' 
            },
            body: JSON.stringify(payloadBody),
        });

        if (!response.ok) {
             const errorText = await response.text();
            throw new Error(`Streamer.bot request failed with status ${response.status}: ${errorText}`);
        }
         return { service: 'Streamer.bot', level: 'info', message: successMessage, details: `Payload: ${JSON.stringify(payloadBody)}` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { service: 'Streamer.bot', level: 'error', message: `Failed to send request: ${errorMessage}`, details: error instanceof Error ? error.stack : undefined };
    }
}

async function sendToNexusConnect(connections: string[], message: string, author: string, secretKey?: string | null) {
    const logs: FlowLog[] = [];
    
    for (const url of connections) {
        if (!url) continue;
        try {
            const payload = { content: message, author };
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (secretKey) {
                headers['Authorization'] = `Bearer ${secretKey}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Nexus Connect webhook to ${url} failed with status ${response.status}: ${errorText}`);
            }
            logs.push({ service: 'Nexus Connect', level: 'info', message: `Successfully sent message to ${url}.` });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            logs.push({ service: 'Nexus Connect', level: 'error', message: `Failed to send message to ${url}: ${errorMessage}`, details: error instanceof Error ? error.stack : undefined });
        }
    }
    return logs;
}


export async function unifiedChatFlow(input: UnifiedChatInput): Promise<UnifiedChatOutput> {
    const logs: FlowLog[] = [];
    const { message, targets, config, nexusConnectTargets } = input;
    let uiReply = '';
    let websiteAction = null;
    const providerStatus = config?.providerStatus || {};
    let messageToSendToServices = message;
    
    const botName = config?.botName || "Nexus";
    const remoteHubAddress = config?.remoteHubAddress;
    
    // If a remote address is configured, forward the entire request to the local hub.
    if (remoteHubAddress && !config.isLocalExecution) {
        try {
            const remoteApiUrl = new URL('/api/nexus-connect/forward', remoteHubAddress).toString();
            const remoteAccessSecret = config.remoteAccessSecret;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (remoteAccessSecret) {
                headers['Authorization'] = `Bearer ${remoteAccessSecret}`;
            }
            
            const remotePayload = { 
              ...input, 
              config: { ...input.config, isLocalExecution: true }
            };
            
            const response = await fetch(remoteApiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(remotePayload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Remote Hub Error (${response.status}): ${errorText}`);
            }

            const successReply = `Command successfully forwarded to local hub: ${remoteHubAddress}.`;
            logs.push({ service: 'Remote Hub', level: 'info', message: successReply });
            return { reply: successReply, logs, websiteAction: null };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            logs.push({ service: 'Remote Hub', level: 'error', message: `Failed to forward request to remote hub: ${errorMessage}`, details: error instanceof Error ? error.stack : undefined });
            return { reply: `Error connecting to Remote Hub: ${errorMessage}`, logs, websiteAction: null };
        }
    }


    const otherTargets = targets.filter(t => t !== 'AI Bot' && t !== 'Website');

    // Handle Website Control logic first if targeted
    if (targets.includes('Website')) {
        try {
            const webControlResult = await websiteControl({ command: message });
            websiteAction = {
                type: 'youtube_search',
                query: webControlResult.searchQuery,
            };
            logs.push({
                service: 'Website Control',
                level: 'info',
                message: `Converted command to YouTube search: "${webControlResult.searchQuery}"`,
                details: `Original command: "${message}"`,
            });
            uiReply = `Website command sent: Searching for "${webControlResult.searchQuery}".`;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            uiReply = `An error occurred with the website control: ${errorMessage}`;
            logs.push({
                service: 'Website Control',
                level: 'error',
                message: `Website control AI call failed: ${errorMessage}`,
                details: error instanceof Error ? error.stack : undefined
            });
        }
    }
    
    // Handle AI Bot logic
    if (targets.includes('AI Bot')) {
        try {
            const systemPrompt = config?.botPersonalityPrompt || 'You are a helpful assistant.';

            const aiResult = await callAIChat({
                userMessage: message,
                systemPrompt: systemPrompt,
                overrideConfig: config as { [key: string]: string | undefined }
            });
            
            const botReply = aiResult.response;
            uiReply = uiReply ? `${uiReply}\n${botReply}` : botReply;

            // If other services are targeted, the AI's reply becomes the payload.
            if(otherTargets.length > 0) {
              messageToSendToServices = aiResult.response; 
              logs.push({ service: 'System', level: 'info', message: 'AI response will be relayed to other selected targets.', details: `AI Response: "${uiReply}"` });
            }

            logs.push(...aiResult.logs);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            const errorReply = `An error occurred with the AI chat: ${errorMessage}`;
            uiReply = uiReply ? `${uiReply}\n${errorReply}` : errorReply;
            logs.push({
                service: 'System',
                level: 'error',
                message: `Unified chat AI call failed: ${errorMessage}`,
                details: error instanceof Error ? error.stack : undefined
            });
            // If the AI fails, we shouldn't send anything to other services.
            return { reply: uiReply, logs, websiteAction };
        }
    }

    // Now, iterate through the other targets and send the appropriate message.
    for (const target of otherTargets) {
        if (target === 'Discord') {
            if (providerStatus.discord === 'disabled') {
                logs.push({ service: 'Discord', level: 'warn', message: 'Discord target selected, but the service is disabled in settings.' });
            } else {
                const webhookUrl = config?.discordWebhook;
                if (webhookUrl) {
                    const discordLog = await sendToDiscordWebhook(webhookUrl, messageToSendToServices, botName);
                    logs.push(discordLog);
                } else {
                    logs.push({ service: 'Discord', level: 'warn', message: 'Discord target selected, but no webhook URL is configured.' });
                }
            }
        }
        
        if (target === 'Streamer.bot') {
            if (providerStatus.streamerbot === 'disabled') {
                logs.push({ service: 'Streamer.bot', level: 'warn', message: 'Streamer.bot target selected, but the service is disabled in settings.' });
            } else {
                const streamerBotLog = await sendToStreamerBot(config, messageToSendToServices);
                logs.push(streamerBotLog);
            }
        }

        if (target === 'Nexus Connect') {
             if (providerStatus.nexusconnect === 'disabled') {
                logs.push({ service: 'Nexus Connect', level: 'warn', message: 'Nexus Connect target selected, but the service is disabled in settings.' });
            } else {
                const connections = nexusConnectTargets || [];
                if (connections.length > 0) {
                    const nexusLogs = await sendToNexusConnect(connections, messageToSendToServices, botName, config?.remoteAccessSecret);
                    logs.push(...nexusLogs);
                } else {
                    logs.push({ service: 'Nexus Connect', level: 'warn', message: 'Nexus Connect target selected, but no connection URLs were chosen.' });
                }
            }
        }
    }

    if (!uiReply && otherTargets.length > 0) {
       uiReply = `Message successfully sent to: ${otherTargets.join(', ')}. No AI reply was requested.`;
    }

    return {
      reply: uiReply,
      logs,
      websiteAction,
    };
}
