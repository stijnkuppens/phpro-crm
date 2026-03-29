import type { ExportColumn } from '@/features/jobs/types';

/**
 * Columns exported for accounts.
 * Keys must match actual DB columns or Supabase select paths.
 */
export const accountExportColumns: ExportColumn[] = [
  { key: 'name', label: 'Account' },
  { key: 'domain', label: 'Domein' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'industry', label: 'Industrie' },
  { key: 'country', label: 'Land' },
  { key: 'vat_number', label: 'BTW-nummer' },
  { key: 'website', label: 'Website' },
  { key: 'phone', label: 'Telefoon' },
  { key: 'owner.full_name', label: 'Owner' },
];

export const ACCOUNT_EXPORT_SELECT =
  'name,domain,type,status,industry,country,vat_number,website,phone,owner:user_profiles!owner_id(full_name)';
