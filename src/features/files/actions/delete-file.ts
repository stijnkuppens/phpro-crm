'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { logAction } from '@/features/audit/actions/log-action';

export async function deleteFile(path: string) {
  await requirePermission('files.delete');
  const admin = createServiceRoleClient();
  const { error } = await admin.storage.from('documents').remove([path]);
  if (error) throw new Error(error.message);

  await logAction({
    action: 'file.deleted',
    entityType: 'file',
    metadata: { path },
  });
}
