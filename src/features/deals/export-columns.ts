import type { ExportColumn } from '@/features/jobs/types';

export const dealExportColumns: ExportColumn[] = [
  { key: 'title', label: 'Titel' },
  { key: 'account.name', label: 'Account' },
  { key: 'pipeline.name', label: 'Type' },
  { key: 'stage.name', label: 'Stage' },
  { key: 'amount', label: 'Bedrag' },
  { key: 'close_date', label: 'Sluitdatum' },
  { key: 'probability', label: 'Kans%' },
  { key: 'lead_source', label: 'Lead Bron' },
  { key: 'origin', label: 'Herkomst' },
  { key: 'owner.full_name', label: 'Owner' },
  { key: 'forecast_category', label: 'Forecast' },
];

export const DEAL_EXPORT_SELECT =
  'title,amount,close_date,probability,lead_source,origin,forecast_category,account:accounts!account_id(name),pipeline:pipelines!pipeline_id(name),stage:pipeline_stages!stage_id(name),owner:user_profiles!owner_id(full_name)';
