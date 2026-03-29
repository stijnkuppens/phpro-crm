import type { FilterOption } from '@/components/admin/data-table-filters';

export const DEAL_SELECT = `
  *,
  account:accounts!account_id(id, name),
  contact:contacts!contact_id(id, first_name, last_name, title),
  owner:user_profiles!owner_id(id, full_name),
  stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
  pipeline:pipelines!pipeline_id(id, name, type)
`;

export const ORIGIN_OPTIONS: FilterOption[] = [
  { value: 'rechtstreeks', label: 'Direct' },
  { value: 'cronos', label: 'Cronos' },
];

export const FORECAST_CATEGORY_OPTIONS: FilterOption[] = [
  { value: 'Commit', label: 'Commit' },
  { value: 'Best Case', label: 'Best Case' },
  { value: 'Pipeline', label: 'Pipeline' },
  { value: 'Omit', label: 'Omit' },
];

export const PAGE_SIZE = 50;

export const ORIGIN_LABELS: Record<string, string> = {
  rechtstreeks: 'Direct',
  cronos: 'Cronos',
};
