import type { ExportColumn } from '@/features/jobs/types';

export const consultantExportColumns: ExportColumn[] = [
  { key: 'first_name', label: 'Voornaam' },
  { key: 'last_name', label: 'Achternaam' },
  { key: 'city', label: 'Stad' },
  { key: 'status', label: 'Status' },
  { key: 'role', label: 'Rol' },
  { key: 'account.name', label: 'Klant' },
  { key: 'hourly_rate', label: 'Uurtarief' },
  { key: 'start_date', label: 'Startdatum' },
  { key: 'end_date', label: 'Einddatum' },
  { key: 'is_indefinite', label: 'Onbepaalde duur' },
];

export const CONSULTANT_EXPORT_SELECT =
  'first_name,last_name,city,status,role,hourly_rate,start_date,end_date,is_indefinite,account:accounts(name)';
