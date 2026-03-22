import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { StorageFile } from '../types';

export const getFiles = cache(async (bucket = 'documents', limit = 100) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage.from(bucket).list('', {
    limit,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    console.error('getFiles error:', error.message);
    return [];
  }
  return (data ?? []) as unknown as StorageFile[];
});
