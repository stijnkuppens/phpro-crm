import { logger } from '@/lib/logger';

/**
 * Extract a human-readable message from an unknown error.
 * Logs the error via pino as a side-effect.
 * Safe to use directly in `catch` blocks: `return err(parseError(e))`
 */
export function parseError(error: unknown): string {
  let message = 'Er is een onverwachte fout opgetreden';

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as Record<string, unknown>).message);
  } else if (typeof error === 'string') {
    message = error;
  }

  try {
    logger.error({ err: error }, message);
  } catch {
    // The error handler itself must never throw
    console.error('[parseError] logging failed:', error);
  }

  return message;
}
