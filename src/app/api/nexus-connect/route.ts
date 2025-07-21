
// src/app/api/nexus-connect/route.ts
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
    
    // Security Check: Ensure the incoming request has the correct secret key
    const localSecret = process.env.REMOTE_ACCESS_SECRET || localStorage.getItem('remoteAccessSecret');
    const authHeader = req.headers.get('Authorization');
    const providedKey = authHeader?.split('Bearer ')[1];

    if (localSecret && providedKey !== localSecret) {
      console.warn(`Unauthorized Nexus Connect request. Provided key: ${providedKey}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing secret key.' }, { status: 401 });
    }
    
    // When a remote message comes in, we want it to display in our chat
    // and potentially trigger our own AI Bot if it's targeted.
    const messageFromRemote = `[${payload.author}] ${payload.content}`;
    
    const relayedMessage = {
      type: 'nexus-connect-message',
      sender: 'ai', // Displayed as an AI/system message
      text: messageFromRemote,
      targets: ['Nexus Connect'],
    };

    // Use BroadcastChannel to send the message to all listening browser contexts
    const channel = new BroadcastChannel('nexus-hub-chat');
    channel.postMessage(relayedMessage);
    channel.close();


    return NextResponse.json({ success: true, message: 'Message broadcasted via BroadcastChannel.' });
  } catch (error) {
    console.error('Failed to relay Nexus Connect message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
