import {
  Calendar,
  type LucideIcon,
  Mail,
  Monitor,
  PartyPopper,
  Phone,
  UtensilsCrossed,
} from 'lucide-react';

export const GROUP_ORDER = [
  'Vandaag',
  'Morgen',
  'Deze week',
  'Later',
  'Verstreken',
  'Gedaan',
] as const;

export const GROUP_COLORS: Record<string, string> = {
  Vandaag: 'text-primary-action',
  Morgen: 'text-primary-action/70',
  'Deze week': 'text-muted-foreground',
  Later: 'text-muted-foreground',
  Verstreken: 'text-destructive',
  Gedaan: 'text-muted-foreground/60',
};

export const ACTIVITY_TYPE_ICONS: Record<string, LucideIcon> = {
  Meeting: Calendar,
  Demo: Monitor,
  Call: Phone,
  'E-mail': Mail,
  Lunch: UtensilsCrossed,
  Event: PartyPopper,
};

export function getActivityGroup(dateStr: string, isDone: boolean): string {
  if (isDone) return 'Gedaan';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const actDate = new Date(dateStr);
  actDate.setHours(0, 0, 0, 0);
  if (actDate.getTime() === today.getTime()) return 'Vandaag';
  if (actDate.getTime() === tomorrow.getTime()) return 'Morgen';
  if (actDate > today && actDate <= weekEnd) return 'Deze week';
  if (actDate > weekEnd) return 'Later';
  return 'Verstreken';
}
