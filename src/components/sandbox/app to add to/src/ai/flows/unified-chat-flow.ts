
'use server';
/**
 * @fileOverview A flow for handling messages from the Unified Chat component.
 * It can route messages to different services like Discord or an internal AI chat.
 *
 * - unifiedChat - The main function to handle chat messages.
 */
import type { UnifiedChatInput, UnifiedChatOutput, FlowLog } from '@/ai/types';
import { callEdenAiChat, EdenAiChatMessage } from '../utils/eden-ai';
import { ROLES, type Role } from '@/lib/roles';


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
                    id: `apollo-station-do-action-${Date.now()}`
                };
                successMessage = `Successfully sent action '${actionName}' to Streamer.bot.`;
                break;

            case 'BroadcastMessage':
                payloadBody = {
                    request: "BroadcastMessage",
                    message: message,
                    id: `apollo-station-broadcast-${Date.now()}`
                };
                successMessage = `Successfully broadcasted message via Streamer.bot.`;
                break;

            case 'SetGlobalVariable':
                if (!variableName) throw new Error("Variable Name is required for 'Set Global Variable' request.");
                payloadBody = {
                    request: "SetGlobal",
                    name: variableName,
                    value: message,
                    id: `apollo-station-set-global-${Date.now()}`
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
                'User-Agent': 'ApolloStation/1.0' 
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
    
    const botName = config?.botName || "Apollo";
    const remoteHubAddress = config?.remoteHubAddress;

    // URL Matching Logic
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matchedUrls = message.match(urlRegex);
    const primaryUrl = matchedUrls ? matchedUrls[0] : null;
    
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

    if (primaryUrl && targets.includes('Website')) {
        websiteAction = { action: 'load_url', payload: primaryUrl };
        uiReply = `Loading URL in Website Viewer: ${primaryUrl}`;
        logs.push({ service: 'Website Control', level: 'info', message: 'URL detected and sent to Website Viewer.', details: `URL: ${primaryUrl}` });
        
        if (targets.length === 1) {
            return { reply: uiReply, logs, websiteAction };
        }
    }


    const otherTargets = targets.filter(t => t !== 'AI Bot' && t !== 'Website');

    if (targets.includes('AI Bot')) {
        try {
            const basePrompt = config?.botPersonalityPrompt || 'You are a helpful assistant.';
            const userRole = config?.userRole || 'Guest'; // Default to Guest
            const userName = config?.userName;
            
            const roleData = ROLES.find(r => r.role === userRole);
            
            let roleDirective = '';
            if (roleData) {
                const nameReference = userName ? `${roleData.role} ${userName}` : `the ${roleData.role}`;
                roleDirective = `Directive: ${roleData.directive.replace(roleData.role, nameReference)}. Tone: ${roleData.tone}. Response Style: ${roleData.response_style}.`;
            } else if (!userName) {
                roleDirective = "The user has not provided a name. Address them with ambiguous terms like 'hey you' or 'welcome aboard'.";
            }

            const finalSystemPrompt = `${basePrompt}\n\n${roleDirective}`.trim();

            const history: EdenAiChatMessage[] = [
                { role: 'system', text: finalSystemPrompt },
                { role: 'user', text: message }
            ];

            const botReply = await callEdenAiChat(config, history);
            
            uiReply = uiReply ? `${uiReply}\n${botReply.text}` : botReply.text;
            logs.push(...botReply.logs);

            if(otherTargets.length > 0) {
              messageToSendToServices = botReply.text; 
              logs.push({ service: 'System', level: 'info', message: 'AI response will be relayed to other selected targets.', details: `AI Response: "${uiReply}"` });
            }

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
            return { reply: uiReply, logs, websiteAction };
        }
    }

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
