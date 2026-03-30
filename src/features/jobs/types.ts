import { z } from 'zod';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Job = {
  id: string;
  type: string;
  status: JobStatus;
  entity: string | null;
  format: string | null;
  filters: Record<string, unknown>;
  select_query: string | null;
  progress: number;
  row_count: number | null;
  file_path: string | null;
  file_size: number | null;
  error: string | null;
  requested_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  pending: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'In wachtrij',
  processing: 'Bezig',
  completed: 'Voltooid',
  failed: 'Mislukt',
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  export: 'Export',
};

export const ENTITY_LABELS: Record<string, string> = {
  accounts: 'Accounts',
  contacts: 'Contacts',
  deals: 'Deals',
  consultants: 'Consultants',
};

export const FORMAT_LABELS: Record<string, string> = {
  xlsx: 'Excel (.xlsx)',
  csv: 'CSV (.csv)',
};

export type ExportColumn = {
  key: string;
  label: string;
};

export const ALLOWED_EXPORT_ENTITIES = [
  'accounts',
  'contacts',
  'deals',
  'consultants',
  'activities',
  'communications',
] as const;
export type AllowedExportEntity = (typeof ALLOWED_EXPORT_ENTITIES)[number];

export const createExportJobSchema = z.object({
  entity: z.enum(ALLOWED_EXPORT_ENTITIES),
  format: z.enum(['xlsx', 'csv']),
  filters: z.record(z.string(), z.unknown()).default({}),
  columns: z.array(z.object({ key: z.string(), label: z.string() })).min(1),
});

export type CreateExportJobValues = z.infer<typeof createExportJobSchema>;
