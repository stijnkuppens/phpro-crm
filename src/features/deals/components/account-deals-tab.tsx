'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import DataTable from '@/components/admin/data-table';
import type { DealWithRelations } from '../types';
import { dealColumns } from '../columns';

type Props = {
  accountId: string;
};

export function AccountDealsTab({ accountId }: Props) {
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('deals')
      .select(`
        *,
        account:accounts!account_id(id, name),
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name),
        stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
        pipeline:pipelines!pipeline_id(id, name, type)
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setDeals((data as unknown as DealWithRelations[]) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accountId]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Deals laden...</div>;
  }

  if (deals.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">Geen deals voor dit account.</div>;
  }

  return <DataTable columns={dealColumns} data={deals} />;
}
