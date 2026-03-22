import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentRate } from '../utils';

type ConsultantStats = {
  benchCount: number;
  activeCount: number;
  stoppedCount: number;
  maxRevenue: number;
};

type StatsRow = {
  status: string;
  hourly_rate: number | null;
  rate_history: { date: string; rate: number }[];
};

export const getConsultantStats = cache(async (): Promise<ConsultantStats> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('consultants')
    .select('status, hourly_rate, rate_history:consultant_rate_history(date, rate)')
    .eq('is_archived', false)
    .in('status', ['bench', 'actief', 'stopgezet']);

  if (error) {
    console.error('Failed to fetch consultant stats:', error.message);
    return { benchCount: 0, activeCount: 0, stoppedCount: 0, maxRevenue: 0 };
  }

  const rows = (data ?? []) as StatsRow[];
  let benchCount = 0;
  let activeCount = 0;
  let stoppedCount = 0;
  let maxRevenue = 0;

  for (const row of rows) {
    switch (row.status) {
      case 'bench':
        benchCount++;
        break;
      case 'actief':
        activeCount++;
        maxRevenue += getCurrentRate(row) * 8 * 21;
        break;
      case 'stopgezet':
        stoppedCount++;
        break;
    }
  }

  return { benchCount, activeCount, stoppedCount, maxRevenue };
});
