'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function deleteFile(path: string) {
  await requirePermission('files.delete');
  const admin = createServiceRoleClient();
  const { error } = await admin.storage.from('documents').remove([path]);
  if (error) throw new Error(error.message);
  // TODO: logAction()
}
