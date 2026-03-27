import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { StorageFile } from '../types';

export const getFiles = cache(async (bucket = 'documents', limit = 200) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage.from(bucket).list('', {
    limit,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    logger.error({ err: error, entity: 'files' }, 'Failed to fetch files');
    return [];
  }
  const items = (data ?? []) as unknown as StorageFile[];
  return items.filter((f) => f.name !== '.emptyFolderPlaceholder');
});
