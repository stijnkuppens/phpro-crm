'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { AccountListItem, AccountFilters } from '../types';

type SearchParams = {
  filters?: AccountFilters;
  page?: number;
  pageSize?: number;
};

export async function searchAccounts({
  filters,
  page = 1,
  pageSize = 25,
}: SearchParams = {}): Promise<{ data: AccountListItem[]; count: number }> {
  const supabase = await createServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('accounts')
    .select('id, name, domain, type, status, owner_id, owner:user_profiles!owner_id(id, full_name)', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,domain.ilike.%${filters.search}%`);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type as 'Klant' | 'Prospect' | 'Partner');
  }
  if (filters?.status) {
    query = query.eq('status', filters.status as 'Actief' | 'Inactief');
  }
  if (filters?.owner_id) {
    query = query.eq('owner_id', filters.owner_id);
  }
  if (filters?.country) {
    query = query.eq('country', filters.country);
  }

  const { data: accounts, count, error } = await query;

  if (error || !accounts) {
    console.error('Failed to search accounts:', error?.message);
    return { data: [], count: 0 };
  }

  const accountIds = accounts.map((a: { id: string }) => a.id);

  if (accountIds.length === 0) {
    return { data: [], count: count ?? 0 };
  }

  const [contractsResult, consultantsResult] = await Promise.all([
    supabase
      .from('contracts')
      .select('account_id, has_framework_contract, has_service_contract')
      .in('account_id', accountIds),
    supabase
      .from('consultants')
      .select('account_id')
      .in('account_id', accountIds)
      .eq('status', 'actief'),
  ]);

  const contractMap = new Map<string, { has_framework_contract: boolean; has_service_contract: boolean }>();
  for (const c of contractsResult.data ?? []) {
    contractMap.set(c.account_id, {
      has_framework_contract: c.has_framework_contract,
      has_service_contract: c.has_service_contract,
    });
  }

  const consultantCountMap = new Map<string, number>();
  for (const c of consultantsResult.data ?? []) {
    if (!c.account_id) continue;
    consultantCountMap.set(c.account_id, (consultantCountMap.get(c.account_id) ?? 0) + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: AccountListItem[] = accounts.map((a: any) => {
    const contract = contractMap.get(a.id);
    return {
      id: a.id,
      name: a.name,
      domain: a.domain,
      type: a.type,
      status: a.status,
      owner: a.owner ?? null,
      has_framework_contract: contract?.has_framework_contract ?? false,
      has_service_contract: contract?.has_service_contract ?? false,
      active_consultant_count: consultantCountMap.get(a.id) ?? 0,
    };
  });

  return { data, count: count ?? 0 };
}
