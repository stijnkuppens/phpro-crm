import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { ok, err, type ActionResult } from '@/lib/action-result';
import type { SimulationResult } from '../types';

export const simulateIndexation = cache(async (
  accountId: string,
  baseYear: number,
  percentage: number,
): Promise<ActionResult<SimulationResult>> => {
  try {
    await requirePermission('indexation.read');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();

  const [{ data: hourlyRates, error: ratesError }, { data: slaRates, error: slaError }] =
    await Promise.all([
      supabase
        .from('hourly_rates')
        .select('role, rate')
        .eq('account_id', accountId)
        .eq('year', baseYear)
        .order('role', { ascending: true }),
      supabase
        .from('sla_rates')
        .select('fixed_monthly_rate, support_hourly_rate')
        .eq('account_id', accountId)
        .eq('year', baseYear)
        .maybeSingle(),
    ]);

  if (ratesError) {
    return err(ratesError.message);
  }
  if (slaError) {
    return err(slaError.message);
  }

  const multiplier = 1 + percentage / 100;

  const rates = (hourlyRates ?? []).map((r) => ({
    role: r.role,
    current_rate: r.rate,
    proposed_rate: Math.round(r.rate * multiplier),
  }));

  const sla = slaRates
    ? {
        fixed_monthly_rate: slaRates.fixed_monthly_rate,
        support_hourly_rate: slaRates.support_hourly_rate,
        proposed_fixed: Math.round(slaRates.fixed_monthly_rate * multiplier),
        proposed_support: Math.round(slaRates.support_hourly_rate * multiplier),
      }
    : null;

  return ok({ rates, sla });
});
