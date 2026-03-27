import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { EmployeeWithDetails } from '../types';

export const getEmployee = cache(
  async (id: string): Promise<EmployeeWithDetails | null> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        children:employee_children(*),
        salary_history:salary_history(*),
        equipment:equipment(*),
        documents:hr_documents(*),
        leave_balances:leave_balances(*),
        evaluations:evaluations(*)
      `)
      .eq('id', id)
      .single();
    if (error) { logger.error({ err: error, entity: 'employees' }, 'Failed to fetch employee'); return null; }
    return data as unknown as EmployeeWithDetails;
  },
);
