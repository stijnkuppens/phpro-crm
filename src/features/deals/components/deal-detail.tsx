'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/admin/modal';
import {
  CheckCircle2, Pencil, Building2, User, Calendar, TrendingUp, Sparkles,
  ClipboardList, Plus, Check, Monitor, Phone, Mail, UtensilsCrossed,
  PartyPopper, Trash2, ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatEUR } from '@/lib/format';
import type { ActivityWithRelations } from '@/features/activities/types';
import type { TaskWithRelations } from '@/features/tasks/types';
import type { CommunicationWithDetails } from '@/features/communications/types';
import { ActivityForm } from '@/features/activities/components/activity-form';
import { TaskForm } from '@/features/tasks/components/task-form';
import { toggleActivityDone } from '@/features/activities/actions/toggle-activity-done';
import { deleteActivity } from '@/features/activities/actions/delete-activity';
import { toggleTaskDone } from '@/features/tasks/actions/toggle-task-done';
import { deleteTask } from '@/features/tasks/actions/delete-task';
import { reopenDeal } from '../actions/reopen-deal';
import { CloseDealModal } from './close-deal-modal';
import type { DealWithRelations } from '../types';
import dynamic from 'next/dynamic';

const DealEditModal = dynamic(() => import('./deal-edit-modal').then(m => ({ default: m.DealEditModal })), { ssr: false });

type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: { id: string; name: string; sort_order: number; is_closed: boolean; probability: number }[];
};

type Props = {
  deal: DealWithRelations;
  activities: ActivityWithRelations[];
  tasks: TaskWithRelations[];
  communications: CommunicationWithDetails[];
  pipelines: Pipeline[];
  owners: { id: string; name: string }[];
  consultant: { id: string; first_name: string; last_name: string; role: string | null; city: string | null } | null;
};

const ORIGIN_LABEL: Record<string, string> = {
  rechtstreeks: 'Rechtstreeks',
  cronos: 'Via Cronos',
};

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const CLOSED_TYPE_COLORS: Record<string, string> = {
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  longterm: 'bg-amber-100 text-amber-700',
};

const CLOSED_TYPE_LABELS: Record<string, string> = {
  won: 'Gewonnen',
  lost: 'Verloren',
  longterm: 'Longterm',
};

const GROUP_ORDER = ['Vandaag', 'Morgen', 'Deze week', 'Later', 'Verstreken', 'Gedaan'] as const;

const GROUP_COLORS: Record<string, string> = {
  Vandaag: 'text-indigo-600',
  Morgen: 'text-blue-500',
  'Deze week': 'text-teal-500',
  Later: 'text-gray-500',
  Verstreken: 'text-red-500',
  Gedaan: 'text-gray-400',
};

const ACTIVITY_TYPE_ICONS: Record<string, typeof Calendar> = {
  Meeting: Calendar,
  Demo: Monitor,
  Call: Phone,
  'E-mail': Mail,
  Lunch: UtensilsCrossed,
  Event: PartyPopper,
};

function getActivityGroup(dateStr: string, isDone: boolean): string {
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

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });

export function DealDetail({ deal, activities, tasks, communications, pipelines, owners, consultant }: Props) {
  const router = useRouter();
  const [showClose, setShowClose] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activityModal, setActivityModal] = useState<{ mode: 'new' } | { mode: 'edit'; activity: ActivityWithRelations } | null>(null);
  const [taskModal, setTaskModal] = useState<{ mode: 'new' } | { mode: 'edit'; task: TaskWithRelations } | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name}${deal.contact.title ? ` \u00B7 ${deal.contact.title}` : ''}`
    : null;

  const isConsultancy = deal.pipeline?.type === 'consultancy';
  const isClosed = !!deal.closed_at;

  // Group activities
  const grouped: Record<string, ActivityWithRelations[]> = {};
  for (const a of activities) {
    const g = getActivityGroup(a.date, a.is_done ?? false);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(a);
  }

  function toggleNote(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleToggleActivityDone(id: string) {
    const result = await toggleActivityDone(id);
    if (!result.success) toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    router.refresh();
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm('Activiteit verwijderen?')) return;
    const result = await deleteActivity(id);
    if (result.success) toast.success('Activiteit verwijderd');
    else toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    router.refresh();
  }

  async function handleToggleTaskDone(id: string) {
    const result = await toggleTaskDone(id);
    if (!result.success) toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    router.refresh();
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Taak verwijderen?')) return;
    const result = await deleteTask(id);
    if (result.success) toast.success('Taak verwijderd');
    else toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    router.refresh();
  }

  async function handleReopenDeal() {
    const result = await reopenDeal(deal.id);
    if (result.success) toast.success('Deal heropend');
    else toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <Card className="overflow-hidden">
        <div className="h-1" style={{ backgroundColor: deal.stage?.color ?? '#6366f1' }} />
        <CardContent className="py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{deal.title}</h2>
                  {deal.pipeline && (
                    <Badge variant="outline">{deal.pipeline.name}</Badge>
                  )}
                  {deal.stage && (
                    <Badge style={{ backgroundColor: deal.stage.color, color: 'white' }}>
                      {deal.stage.name}
                    </Badge>
                  )}
                  {isClosed && (
                    <Badge variant="secondary">Gesloten</Badge>
                  )}
                  {deal.closed_type && (
                    <Badge className={cn('border-0', CLOSED_TYPE_COLORS[deal.closed_type] ?? '')}>
                      {CLOSED_TYPE_LABELS[deal.closed_type] ?? deal.closed_type}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {deal.account?.name}
                  {deal.owner?.full_name && <> &middot; {deal.owner.full_name}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isClosed ? (
                <Button size="sm" variant="outline" onClick={handleReopenDeal}>
                  <RotateCcw /> Heropen
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowClose(true)}>
                  <CheckCircle2 /> Afsluiten
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                <Pencil /> Wijzigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content: Deal info + Financial sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal info -- left 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Deal info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Account" value={deal.account?.name} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Contactpersoon" value={contactName} />
            {isConsultancy && consultant && (
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Consultant"
                value={`${consultant.first_name} ${consultant.last_name}${consultant.city ? ` \u00B7 ${consultant.city}` : ''}`}
              />
            )}
            {isConsultancy && deal.consultant_role && (
              <InfoRow label="Gevraagde rol" value={deal.consultant_role} />
            )}
            {isConsultancy && deal.tarief_gewenst != null && (
              <InfoRow label="Gewenst tarief" value={`\u20AC${deal.tarief_gewenst}/u`} />
            )}
            {isConsultancy && deal.tarief_aangeboden != null && (
              <InfoRow label="Aangeboden tarief" value={`\u20AC${deal.tarief_aangeboden}/u`} />
            )}
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Sluitdatum" value={deal.close_date ? fmtDate(deal.close_date) : null} />
            <InfoRow label="Leadbron" value={deal.lead_source} />
            <InfoRow label="Herkomst" value={deal.origin ? ORIGIN_LABEL[deal.origin] ?? deal.origin : null} />
            {deal.origin === 'cronos' && (
              <>
                {deal.cronos_cc && <InfoRow label="Cronos CC" value={deal.cronos_cc} />}
                {deal.cronos_contact && <InfoRow label="Cronos contact" value={deal.cronos_contact} />}
                {deal.cronos_email && <InfoRow label="Cronos e-mail" value={deal.cronos_email} />}
              </>
            )}
            {deal.description && (
              <div>
                <span className="text-muted-foreground">Beschrijving</span>
                <p className="mt-1 whitespace-pre-wrap">{deal.description}</p>
              </div>
            )}
            {deal.tags && deal.tags.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {deal.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial sidebar -- right col */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Financieel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConsultancy ? (
                <>
                  {deal.tarief_gewenst != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Gewenst tarief</span>
                      <span className="text-sm font-semibold">&euro;{deal.tarief_gewenst}<span className="text-xs font-normal text-muted-foreground">/u</span></span>
                    </div>
                  )}
                  {deal.tarief_aangeboden != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Aangeboden tarief</span>
                      <span className="text-sm font-bold text-primary-action">&euro;{deal.tarief_aangeboden}<span className="text-xs font-normal text-muted-foreground">/u</span></span>
                    </div>
                  )}
                  {deal.tarief_gewenst == null && deal.tarief_aangeboden == null && (
                    <p className="text-sm text-muted-foreground">Geen tarief ingevuld</p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Waarde</span>
                  <span className="text-xl font-bold">{formatEUR(Number(deal.amount ?? 0))}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Kans</span>
                  <span className="font-medium">{deal.probability ?? 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${deal.probability ?? 0}%` }}
                  />
                </div>
              </div>
              {deal.close_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sluitdatum</span>
                  <span>{fmtDate(deal.close_date)}</span>
                </div>
              )}
              {deal.forecast_category && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Forecast</span>
                  <Badge variant="outline">{deal.forecast_category}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {deal.owner && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary-action">
                    {getInitials(deal.owner.full_name ?? '')}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="text-sm font-medium">{deal.owner.full_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isConsultancy && consultant && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Consultant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary-action">
                    {getInitials(`${consultant.first_name} ${consultant.last_name}`)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{consultant.first_name} {consultant.last_name}</p>
                    {consultant.city && <p className="text-xs text-muted-foreground">{consultant.city}</p>}
                  </div>
                </div>
                {consultant.role && (
                  <Badge variant="outline" className="mt-2">{consultant.role}</Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Closed deal info */}
      {deal.closed_type && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Afsluiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Type" value={CLOSED_TYPE_LABELS[deal.closed_type] ?? deal.closed_type} />
            <InfoRow label="Reden" value={deal.closed_reason} />
            <InfoRow label="Notities" value={deal.closed_notes} />
            <InfoRow label="Datum" value={deal.closed_at ? fmtDate(deal.closed_at) : null} />
            {deal.longterm_date && (
              <InfoRow label="Follow-up" value={fmtDate(deal.longterm_date)} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Activities + Tasks side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Activiteiten
                {activities.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{activities.length}</Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActivityModal({ mode: 'new' })}>
                <Plus /> Nieuwe activiteit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="py-12 text-center">
                <div className="p-3 bg-muted rounded-xl inline-block mb-3">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nog geen activiteiten</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActivityModal({ mode: 'new' })}>
                  <Plus /> Eerste activiteit toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {GROUP_ORDER.filter((g) => grouped[g] && grouped[g].length > 0).map((group) => (
                  <div key={group}>
                    {/* Group label */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn('text-xs font-semibold uppercase tracking-wide', GROUP_COLORS[group] ?? 'text-gray-500')}>
                        {group}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {/* Activity items */}
                    <div className="space-y-3">
                      {grouped[group].map((a) => {
                        const Icon = ACTIVITY_TYPE_ICONS[a.type] ?? Sparkles;
                        const hasNote = a.notes && typeof a.notes === 'string' && a.notes.trim().length > 0;
                        const expanded = expandedNotes.has(a.id);

                        return (
                          <div
                            key={a.id}
                            className={cn(
                              'rounded-xl border p-4 transition-all',
                              a.is_done
                                ? 'border-gray-200 bg-gray-50'
                                : group === 'Verstreken'
                                  ? 'border-red-200 bg-red-50'
                                  : 'border-amber-200 bg-amber-50',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'p-1.5 rounded-lg shrink-0 mt-0.5',
                                a.is_done ? 'bg-gray-200 text-gray-500' : 'bg-amber-100 text-amber-600',
                              )}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className={cn(
                                      'text-sm font-semibold',
                                      a.is_done ? 'text-gray-500 line-through' : group === 'Verstreken' ? 'text-red-800' : 'text-foreground',
                                    )}>
                                      {a.subject}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className={cn(
                                        'text-xs',
                                        a.is_done ? 'text-gray-400' : group === 'Verstreken' ? 'text-red-500' : 'text-amber-600',
                                      )}>
                                        {fmtDate(a.date)}
                                      </span>
                                      {a.duration_minutes != null && a.duration_minutes > 0 && (
                                        <span className="text-xs text-muted-foreground">{a.duration_minutes} min</span>
                                      )}
                                      <Badge
                                        className={cn(
                                          'text-[10px] py-0 border-0',
                                          a.is_done ? 'bg-gray-200 text-gray-500' : group === 'Verstreken' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700',
                                        )}
                                      >
                                        {a.type}
                                      </Badge>
                                    </div>
                                  </div>
                                  {/* Actions */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      title={a.is_done ? 'Heropen' : 'Markeer gedaan'}
                                      onClick={() => handleToggleActivityDone(a.id)}
                                      className={cn(
                                        'p-1.5 rounded-lg transition-colors text-xs',
                                        a.is_done ? 'hover:bg-gray-200 text-gray-400' : 'hover:bg-green-100 text-green-600',
                                      )}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      title="Bewerken"
                                      onClick={() => setActivityModal({ mode: 'edit', activity: a })}
                                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      title="Verwijderen"
                                      onClick={() => handleDeleteActivity(a.id)}
                                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                {/* Note toggle */}
                                {hasNote && (
                                  <div className="mt-2">
                                    {expanded ? (
                                      <>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.notes as string}</p>
                                        <button onClick={() => toggleNote(a.id)} className="flex items-center gap-1 text-xs text-primary-action hover:underline mt-1">
                                          <ChevronUp className="h-3 w-3" /> Minder tonen
                                        </button>
                                      </>
                                    ) : (
                                      <button onClick={() => toggleNote(a.id)} className="flex items-center gap-1 text-xs text-primary-action hover:underline">
                                        <ChevronDown className="h-3 w-3" /> Notitie tonen
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Taken
                {tasks.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setTaskModal({ mode: 'new' })}>
                <Plus /> Nieuwe taak
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="py-12 text-center">
                <div className="p-3 bg-muted rounded-xl inline-block mb-3">
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nog geen taken voor deze deal</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setTaskModal({ mode: 'new' })}>
                  <Plus /> Eerste taak toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const isDone = t.status === 'Done';
                  const isOverdue = !isDone && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all',
                        isDone ? 'border-gray-200 bg-gray-50' : isOverdue ? 'border-red-200 bg-red-50' : 'border-indigo-100 bg-indigo-50',
                      )}
                    >
                      <button
                        onClick={() => handleToggleTaskDone(t.id)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          isDone ? 'bg-green-500 border-green-500' : 'border-gray-400 hover:border-indigo-400',
                        )}
                      >
                        {isDone && <Check className="h-3 w-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          isDone ? 'line-through text-gray-400' : isOverdue ? 'text-red-800' : 'text-foreground',
                        )}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {t.due_date && (
                            <span className={cn(
                              'text-xs',
                              isDone ? 'text-gray-400' : isOverdue ? 'text-red-500' : 'text-indigo-500',
                            )}>
                              {fmtDate(t.due_date)}
                            </span>
                          )}
                          {t.assignee?.full_name && (
                            <span className="text-xs text-muted-foreground">{t.assignee.full_name}</span>
                          )}
                          <Badge className={cn('text-[10px] py-0 border-0', PRIORITY_COLORS[t.priority] ?? '')}>
                            {t.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          title="Bewerken"
                          onClick={() => setTaskModal({ mode: 'edit', task: t })}
                          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Verwijderen"
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communications */}
      {communications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Communicatie
              <Badge variant="secondary" className="ml-2">{communications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communications.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">{c.subject}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{c.type}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{fmtDate(c.date)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showClose && (
        <CloseDealModal
          dealId={deal.id}
          open
          onOpenChange={(v) => { if (!v) setShowClose(false); }}
          onSuccess={() => router.refresh()}
        />
      )}

      {showEdit && (
        <DealEditModal
          key={deal.id}
          open
          onClose={() => { setShowEdit(false); router.refresh(); }}
          accountId={deal.account_id}
          pipelines={pipelines}
          owners={owners}
          deal={deal}
        />
      )}

      {activityModal && (
        <Modal
          open
          onClose={() => { setActivityModal(null); router.refresh(); }}
          title={activityModal.mode === 'edit' ? 'Activiteit bewerken' : 'Nieuwe activiteit'}
        >
          <ActivityForm
            defaultValues={activityModal.mode === 'edit'
              ? {
                  ...activityModal.activity,
                  id: activityModal.activity.id,
                  type: activityModal.activity.type as 'Meeting' | 'Demo' | 'Call' | 'E-mail' | 'Lunch' | 'Event',
                }
              : { account_id: deal.account_id, deal_id: deal.id }
            }
            onSuccess={() => { setActivityModal(null); router.refresh(); }}
            onCancel={() => setActivityModal(null)}
          />
        </Modal>
      )}

      {taskModal && (
        <Modal
          open
          onClose={() => { setTaskModal(null); router.refresh(); }}
          title={taskModal.mode === 'edit' ? 'Taak bewerken' : 'Nieuwe taak'}
        >
          <TaskForm
            defaultValues={taskModal.mode === 'edit'
              ? {
                  ...taskModal.task,
                  id: taskModal.task.id,
                  priority: taskModal.task.priority as 'High' | 'Medium' | 'Low',
                  status: taskModal.task.status as 'Open' | 'In Progress' | 'Done',
                }
              : { account_id: deal.account_id ?? undefined, deal_id: deal.id }
            }
            owners={owners}
            onSuccess={() => { setTaskModal(null); router.refresh(); }}
            onCancel={() => setTaskModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
