'use client';

import { CalendarPlus, CheckCircle2, Circle, SquarePen, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ActivityWithRelations } from '../types';

export const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  Meeting: { label: 'Meeting', className: 'bg-green-50 text-green-700 border-green-200' },
  Call: { label: 'Call', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  'E-mail': { label: 'E-mail', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Demo: { label: 'Demo', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Lunch: { label: 'Lunch', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Event: { label: 'Event', className: 'bg-pink-50 text-pink-700 border-pink-200' },
};

type ActivityRowProps = {
  activity: ActivityWithRelations;
  showAccount?: boolean;
  onToggleDone: (activity: ActivityWithRelations) => void;
  onEdit?: (activity: ActivityWithRelations) => void;
  onDelete: (id: string) => void;
};

function downloadIcs(activity: ActivityWithRelations) {
  const start = new Date(activity.date);
  const end = new Date(start.getTime() + (activity.duration_minutes ?? 60) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const accountName = activity.account?.name ? ` — ${activity.account.name}` : '';
  const accountUrl = activity.account_id ? `${window.location.origin}/admin/accounts/${activity.account_id}` : '';

  const dealUrl = activity.deal_id ? `${window.location.origin}/admin/deals/${activity.deal_id}` : '';

  const descParts = [activity.type];
  if (activity.deal?.title) descParts.push(`Deal: ${activity.deal.title}${dealUrl ? ` — ${dealUrl}` : ''}`);
  if (accountUrl) descParts.push(`Account: ${activity.account?.name ?? ''}${accountUrl ? ` — ${accountUrl}` : ''}`);
  const description = descParts.join('\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PHPro CRM//Activity//NL',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${activity.subject}${accountName}`,
    `DESCRIPTION:${description}`,
    ...(accountUrl ? [`URL:${accountUrl}`] : []),
    `UID:${activity.id}@phpro-crm`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activity.subject.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ActivityRow({ activity, showAccount, onToggleDone, onEdit, onDelete }: ActivityRowProps) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type] ?? {
    label: activity.type,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${activity.is_done ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => onToggleDone(activity)}
        className="shrink-0 text-muted-foreground hover:text-primary-action transition-colors"
        title={activity.is_done ? 'Markeer als niet afgerond' : 'Markeer als afgerond'}
      >
        {activity.is_done ? (
          <CheckCircle2 className="h-5 w-5 text-primary-action" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${activity.is_done ? 'line-through' : ''}`}>
          {activity.subject}
        </span>
        {showAccount && activity.account && (
          <span className="ml-2 text-xs text-muted-foreground">
            {activity.account.name}
          </span>
        )}
        {activity.deal && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {activity.deal.title}
          </Badge>
        )}
      </div>

      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(activity.date).toLocaleString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => downloadIcs(activity)}
        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-primary-action hover:bg-primary/10"
        title="Toevoegen aan agenda"
      >
        <CalendarPlus className="h-4 w-4" />
      </Button>

      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(activity)}
          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-primary-action hover:bg-primary/10"
          title="Bewerken"
        >
          <SquarePen className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(activity.id)}
        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Verwijderen"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
