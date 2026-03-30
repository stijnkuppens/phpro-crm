// Internal utility — NOT a server action. Called only from other 'use server' actions.
// Do not add 'use server' — that would expose logAction as a callable endpoint.

import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function logAction(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, Json>;
}): Promise<void> {
  // Skip logging if before/after are present but identical (no actual change)
  if (params.metadata?.before && params.metadata?.after) {
    const before = params.metadata.before;
    const after = params.metadata.after;
    if (typeof before === 'object' && typeof after === 'object') {
      // Compare only the keys present in `after` (the submitted fields)
      const afterKeys = Object.keys(after as Record<string, unknown>);
      const hasChange = afterKeys.some(
        (key) =>
          JSON.stringify((before as Record<string, unknown>)[key]) !==
          JSON.stringify((after as Record<string, unknown>)[key]),
      );
      if (!hasChange) return;
    }
  }
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const ip = forwardedFor?.split(',').pop()?.trim() ?? null;

  const admin = createServiceRoleClient();
  const { error } = await admin.from('audit_logs').insert({
    user_id: user?.id ?? null,
    action: params.action,
    entity: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: { ...(params.metadata ?? {}), ip_address: ip },
  });
  if (error) {
    logger.error(
      {
        err: error,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
      },
      'Failed to write audit log',
    );
  }
}
