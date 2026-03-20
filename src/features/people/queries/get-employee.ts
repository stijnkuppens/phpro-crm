import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
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
    if (error) { console.error('Failed to fetch employee:', error.message); return null; }
    return data as unknown as EmployeeWithDetails;
  },
);
