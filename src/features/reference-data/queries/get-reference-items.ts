import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { RefTableKey, ReferenceItem } from '../types';

export const getReferenceItems = cache(async (table: RefTableKey): Promise<ReferenceItem[]> => {
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .select('id, name, sort_order, is_active, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ReferenceItem[];
});
