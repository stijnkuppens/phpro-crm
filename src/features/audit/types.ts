import type { Database } from '@/types/database';

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export type AuditLogFilters = {
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
};
