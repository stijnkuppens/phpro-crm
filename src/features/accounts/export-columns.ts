import type { ExportColumn } from '@/features/jobs/types';

export const accountExportColumns: ExportColumn[] = [
  { key: 'name', label: 'Account' },
  { key: 'domain', label: 'Domein' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'has_framework_contract', label: 'Raamcontract' },
  { key: 'has_service_contract', label: 'SLA' },
  { key: 'active_consultant_count', label: 'Consultants' },
  { key: 'country', label: 'Land' },
  { key: 'city', label: 'Stad' },
  { key: 'vat_number', label: 'BTW-nummer' },
];

export const ACCOUNT_EXPORT_SELECT =
  'name,domain,type,status,has_framework_contract,has_service_contract,active_consultant_count,country,city,vat_number';
