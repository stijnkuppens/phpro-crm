import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Lightweight query returning only active {id, name} pairs for form dropdowns/suggestions.
 * Sorted by sort_order.
 */
export const getReferenceOptions = cache(async (table: string) => {
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from(table) as any)
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []) as { id: string; name: string }[];
});
