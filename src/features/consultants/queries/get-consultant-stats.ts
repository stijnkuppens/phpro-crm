import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type ConsultantStats = {
  benchCount: number;
  activeCount: number;
  stoppedCount: number;
  maxRevenue: number;
};

export const getConsultantStats = cache(async (): Promise<ConsultantStats> => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_consultant_stats').single();

  if (error || !data) {
    logger.error({ err: error, entity: 'consultants' }, 'Failed to fetch consultant stats');
    return { benchCount: 0, activeCount: 0, stoppedCount: 0, maxRevenue: 0 };
  }
  return {
    benchCount: Number(data.bench_count),
    activeCount: Number(data.active_count),
    stoppedCount: Number(data.stopped_count),
    maxRevenue: Number(data.max_revenue),
  };
});
