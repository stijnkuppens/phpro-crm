'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { logAction } from '@/features/audit/actions/log-action';
import { ok, err, type ActionResult } from '@/lib/action-result';

export async function deleteFile(path: string): Promise<ActionResult> {
  await requirePermission('files.delete');
  const admin = createServiceRoleClient();
  const { error } = await admin.storage.from('documents').remove([path]);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'file.deleted',
    entityType: 'file',
    metadata: { path },
  });

  return ok();
}

export async function deleteFiles(paths: string[]): Promise<ActionResult> {
  await requirePermission('files.delete');
  const admin = createServiceRoleClient();
  const { error } = await admin.storage.from('documents').remove(paths);

  if (error) {
    return err(error.message);
  }

  await logAction({
    action: 'file.deleted',
    entityType: 'file',
    metadata: { paths },
  });

  return ok();
}
