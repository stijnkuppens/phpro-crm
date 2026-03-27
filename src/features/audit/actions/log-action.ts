import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
import { logger } from '@/lib/logger';

export async function logAction(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, Json>;
}): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  const admin = createServiceRoleClient();
  const { error } = await admin.from('audit_logs').insert({
    user_id: user?.id ?? null,
    action: params.action,
    entity: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: { ...(params.metadata ?? {}), ip_address: ip },
  });
  if (error) {
    logger.error({ err: error, action: params.action, entityType: params.entityType, entityId: params.entityId }, 'Failed to write audit log');
  }
}
