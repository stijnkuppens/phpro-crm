import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifySignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * POST /api/webhooks
 *
 * Receives external webhook payloads with HMAC-SHA256 signature verification.
 * Signature is provided via `x-webhook-signature` header (hex-encoded).
 *
 * @header x-webhook-signature - HMAC-SHA256 hex digest of the raw request body
 * @returns {{ received: true }} on successful verification
 * @returns {{ error: string }} with 401 status on signature mismatch
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-webhook-signature');

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const payload = JSON.parse(body);

  // Handle webhook payload here
  logger.info({ event: 'webhook_received' }, 'Webhook received');

  return NextResponse.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } });
}
