'use server';
// src/app/api/nexus-connect/forward/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { unifiedChatFlow } from '@/ai/flows/unified-chat-flow';
import type { UnifiedChatInput } from '@/ai/types';

/**
 * This endpoint is for forwarding a complete Unified Chat command from a remote
 * instance (e.g., a cloud-deployed UI) to a local hub for execution.
 * It expects the full UnifiedChatInput object in the body.
 */
export async function POST(req: NextRequest) {
  try {
    const payload: UnifiedChatInput = await req.json();
    
    // Security Check: Verify the secret key sent from the remote UI.
    // The secret key is stored in the local instance's environment variables or local storage.
    const localSecret = process.env.REMOTE_ACCESS_SECRET || payload.config?.remoteAccessSecret;
    const authHeader = req.headers.get('Authorization');
    const providedKey = authHeader?.split('Bearer ')[1];
    
    if (!localSecret || providedKey !== localSecret) {
      console.warn(`Unauthorized Forward request. Provided key: ${providedKey}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing secret key.' }, { status: 401 });
    }

    // The payload is the full input for the chat flow.
    // The `isLocalExecution` flag should already be set to true by the sender
    // to prevent infinite forwarding loops.
    const result = await unifiedChatFlow(payload);

    // Return the result to the original caller (the remote UI)
    return NextResponse.json(result);

  } catch (error) {
    console.error('Failed to forward and execute request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
