import type { ExportColumn } from '@/features/jobs/types';

export const contactExportColumns: ExportColumn[] = [
  { key: 'first_name', label: 'Voornaam' },
  { key: 'last_name', label: 'Achternaam' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefoon' },
  { key: 'title', label: 'Functie' },
  { key: 'role', label: 'Rol' },
  { key: 'account.name', label: 'Account' },
  { key: 'is_steerco', label: 'Steerco' },
];

export const CONTACT_EXPORT_SELECT =
  'first_name,last_name,email,phone,title,role,is_steerco,account:accounts!account_id(name)';
