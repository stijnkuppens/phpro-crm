import { cache } from 'react';
import { logger } from '@/lib/logger';
import { createServerClient } from '@/lib/supabase/server';

export type AccountBannerStats = {
  consultantCount: number;
  contactCount: number;
  dealCount: number;
  activityCount: number;
  pipelineValue: number;
  monthlyRevenue: number;
};

export const getAccountBannerStats = cache(
  async (accountId: string): Promise<AccountBannerStats> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .rpc('get_account_banner_stats', { p_account_id: accountId })
      .single();

    if (error || !data) {
      logger.error({ err: error, entity: 'accounts' }, 'Failed to fetch account banner stats');
      return {
        consultantCount: 0,
        contactCount: 0,
        dealCount: 0,
        activityCount: 0,
        pipelineValue: 0,
        monthlyRevenue: 0,
      };
    }
    return {
      consultantCount: Number(data.consultant_count),
      contactCount: Number(data.contact_count),
      dealCount: Number(data.deal_count),
      activityCount: Number(data.activity_count),
      pipelineValue: Number(data.pipeline_value),
      monthlyRevenue: Number(data.monthly_revenue),
    };
  },
);
