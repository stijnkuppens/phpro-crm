'use client';

import { useCallback, useMemo, useState } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterBar } from '@/components/admin/filter-bar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { CommunicationModal } from '@/features/communications/components/communication-modal';
import type { Communication, CommunicationWithDetails } from '@/features/communications/types';
import type { DateRange } from 'react-day-picker';
import { Mail, FileText, Users, Phone, ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';

type Props = {
  accountId: string;
  initialData: CommunicationWithDetails[];
  initialCount: number;
  contacts?: { id: string; first_name: string; last_name: string }[];
  deals?: { id: string; title: string }[];
};

const TYPE_CONFIG = {
  email: { icon: Mail, bg: 'bg-blue-50 dark:bg-blue-950', color: 'text-blue-600 dark:text-blue-400', label: 'E-mail' },
  note: { icon: FileText, bg: 'bg-amber-50 dark:bg-amber-950', color: 'text-amber-600 dark:text-amber-400', label: 'Notitie' },
  meeting: { icon: Users, bg: 'bg-green-50 dark:bg-green-950', color: 'text-green-600 dark:text-green-400', label: 'Vergadering' },
  call: { icon: Phone, bg: 'bg-purple-50 dark:bg-purple-950', color: 'text-purple-600 dark:text-purple-400', label: 'Call' },
} as const;

type CommType = keyof typeof TYPE_CONFIG;

const FILTER_CHIPS: { value: CommType | null; label: string }[] = [
  { value: null, label: 'Alles' },
  { value: 'email', label: 'E-mail' },
  { value: 'note', label: 'Notitie' },
  { value: 'meeting', label: 'Vergadering' },
  { value: 'call', label: 'Call' },
];

export function AccountCommunicationsTab({ accountId, initialData, initialCount, contacts = [], deals = [] }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<CommType | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  // Derive unique owners from data for the filter dropdown
  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of initialData) {
      if (c.owner?.id) {
        map.set(c.owner.id, c.owner.full_name || 'Onbekend');
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [initialData]);

  // Client-side filtering (all data loaded with pageSize 100)
  const filteredData = useMemo(() => {
    let result = initialData;

    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const content = typeof c.content === 'object' && c.content ? (c.content as { text?: string }).text ?? '' : typeof c.content === 'string' ? c.content : '';
        return (
          c.subject?.toLowerCase().includes(q) ||
          content.toLowerCase().includes(q) ||
          c.to?.toLowerCase().includes(q)
        );
      });
    }
    if (ownerFilter !== 'all') {
      result = result.filter((c) => c.owner?.id === ownerFilter);
    }
    if (dateRange?.from) {
      result = result.filter((c) => new Date(c.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59);
      result = result.filter((c) => new Date(c.date) <= to);
    }

    return result;
  }, [initialData, typeFilter, search, ownerFilter, dateRange]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    window.location.reload();
  }, []);

  return (
    <div className="space-y-4 mt-4">
      {/* Search + filters bar */}
      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op onderwerp, inhoud..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-44">
                {ownerFilter === 'all'
                  ? 'Alle gebruikers'
                  : owners.find((o) => o.id === ownerFilter)?.name ?? 'Alle gebruikers'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle gebruikers</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Datum bereik"
              className="h-10"
            />
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nieuw
            </Button>
          </div>
          {/* Type pills */}
          <div className="flex gap-1.5">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setTypeFilter(chip.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  typeFilter === chip.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </FilterBar>

      {/* Timeline */}
      {filteredData.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Geen communicatie gevonden.</div>
      ) : (
        <div className="space-y-2">
          {filteredData.map((comm) => {
            const config = TYPE_CONFIG[comm.type as CommType] ?? TYPE_CONFIG.note;
            const Icon = config.icon;
            const isExpanded = expanded.has(comm.id);
            const contentObj = typeof comm.content === 'object' && comm.content ? (comm.content as { text?: string }) : null;
            const contentStr = contentObj?.text ?? (typeof comm.content === 'string' ? comm.content : '');

            return (
              <div key={comm.id} className="border rounded-lg bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(comm.id)}
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  {/* Color-coded icon */}
                  <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-md ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{comm.subject}</span>
                      {comm.deal && (
                        <Badge className="bg-primary/15 text-primary-action border-0 text-xs shrink-0">
                          {comm.deal.title}
                        </Badge>
                      )}
                      {comm.contact && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {comm.contact.first_name} {comm.contact.last_name}
                        </Badge>
                      )}
                    </div>
                    {contentStr && !isExpanded && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{contentStr}</p>
                    )}
                  </div>

                  {/* Date + owner + expand */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(comm.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}
                        {new Date(comm.date).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {comm.owner?.full_name && (
                        <div className="text-xs text-muted-foreground">{comm.owner.full_name}</div>
                      )}
                    </div>
                    {comm.owner?.full_name && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                        {comm.owner.full_name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && contentStr && (
                  <div className="px-3 pb-3 pt-0 ml-11 border-t">
                    <p className="text-sm text-foreground whitespace-pre-wrap mt-2">{contentStr}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <CommunicationModal
          open={modalOpen}
          onClose={handleModalClose}
          accountId={accountId}
          contacts={contacts}
          deals={deals}
        />
      )}
    </div>
  );
}
