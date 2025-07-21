
// src/app/api/streamerbot-relay/route.ts
import { type NextRequest, NextResponse } from 'next/server';

// This is an experimental feature and requires the right environment flags.
// It allows us to get a BroadcastChannel instance that can communicate
// with browser tabs.
// @ts-ignore
import { unstable_getServerSession } from 'next-auth/next';
// @ts-ignore
import { BroadcastChannel } from 'next/dist/server/web/spec-extension/broadcast-channel';

export async function POST(req: NextRequest) {
  try {
    let messageText = '';
    try {
        const payload = await req.json();
        const event = payload.event || 'Unknown Event';
        const user = payload.user || 'System';
        messageText = `[Streamer.bot] Event: ${event} from ${user}`;
    } catch (jsonError) {
        // If JSON parsing fails, it might be plain text from a simple webhook
        const textPayload = await req.text();
        messageText = `[Streamer.bot] Raw Event: ${textPayload}`;
    }
    
    if (!messageText) {
       return NextResponse.json({ error: 'Empty payload received' }, { status: 400 });
    }

    const relayedMessage = {
      type: 'streamerbot-message',
      sender: 'ai', // We'll display it like an AI message for consistency
      text: messageText,
      targets: ['Streamer.bot Relay'],
    };

    // Use BroadcastChannel to send the message to all listening browser contexts
    const channel = new BroadcastChannel('apollo-station-chat');
    channel.postMessage(relayedMessage);
    channel.close();

    return NextResponse.json({ success: true, message: 'Message broadcasted via BroadcastChannel.' });

  } catch (error) {
    console.error('Failed to relay Streamer.bot message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
