
// src/app/api/discord-relay/route.ts
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
    const payload = await req.json();

    if (!payload.content || !payload.author) {
      return NextResponse.json({ error: 'Invalid payload: content and author are required.' }, { status: 400 });
    }

    const relayedMessage = {
      type: 'discord-message',
      sender: 'ai', // Displayed as an AI/system message
      text: `[Discord] ${payload.author}: ${payload.content}`,
      targets: ['Discord Relay'],
    };

    // Use BroadcastChannel to send the message to all listening browser contexts
    const channel = new BroadcastChannel('nexus-hub-chat');
    channel.postMessage(relayedMessage);
    channel.close();

    return NextResponse.json({ success: true, message: 'Message broadcasted via BroadcastChannel.' });
  } catch (error) {
    console.error('Failed to relay Discord message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
