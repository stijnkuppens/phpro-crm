import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Lightweight query returning only active {id, name} pairs for form dropdowns/suggestions.
 * Sorted by sort_order.
 */
export const getReferenceOptions = cache(async (table: string) => {
  const supabase = await createServerClient();
  const select = table === 'ref_internal_people' ? 'id, name, avatar_url' : 'id, name';
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name requires any cast for both arg and return
  const { data } = await (supabase.from(table as any) as any)
    .select(select)
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []) as {
    id: string;
    name: string;
    avatar_url?: string | null;
  }[];
});
