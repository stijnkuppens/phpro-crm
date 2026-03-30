import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ReferenceItem, RefTableKey } from '../types';

export const getReferenceItems = cache(async (table: RefTableKey): Promise<ReferenceItem[]> => {
  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name returns union type that cannot be narrowed
  const { data, error } = await (supabase.from(table) as any)
    .select('id, name, sort_order, is_active:active, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ReferenceItem[];
});
