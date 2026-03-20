'use client';

import { useCallback, useState } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommunicationModal } from '@/features/communications/components/communication-modal';
import type { Communication, CommunicationWithDetails } from '@/features/communications/types';
import { Mail, FileText, Users, Phone, ChevronDown, ChevronRight, Plus } from 'lucide-react';

type Props = {
  accountId: string;
  initialData: CommunicationWithDetails[];
  initialCount: number;
};

const TYPE_CONFIG = {
  email: { icon: Mail, bg: 'bg-blue-50 dark:bg-blue-950', color: 'text-blue-600 dark:text-blue-400', label: 'E-mail' },
  note: { icon: FileText, bg: 'bg-amber-50 dark:bg-amber-950', color: 'text-amber-600 dark:text-amber-400', label: 'Notitie' },
  meeting: { icon: Users, bg: 'bg-green-50 dark:bg-green-950', color: 'text-green-600 dark:text-green-400', label: 'Meeting' },
  call: { icon: Phone, bg: 'bg-purple-50 dark:bg-purple-950', color: 'text-purple-600 dark:text-purple-400', label: 'Call' },
} as const;

type CommType = keyof typeof TYPE_CONFIG;

const FILTER_CHIPS: { value: CommType | null; label: string }[] = [
  { value: null, label: 'Alles' },
  { value: 'email', label: 'E-mail' },
  { value: 'note', label: 'Notitie' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
];

export function AccountCommunicationsTab({ accountId, initialData, initialCount }: Props) {
  const [displayData, setDisplayData] = useState<CommunicationWithDetails[]>(initialData);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<CommType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  const { fetchList } = useEntity<Communication>({
    table: 'communications',
    pageSize: 100,
    initialData: initialData as unknown as Communication[],
    initialCount,
  });

  const handleFilterChange = useCallback(
    async (type: CommType | null) => {
      setTypeFilter(type);
      setFilterLoading(true);

      const eqFilters: Record<string, string> = { account_id: accountId };
      if (type) {
        eqFilters.type = type;
      }

      // useEntity fetchList updates its internal data, but we need CommunicationWithDetails.
      // Since useEntity only selects '*' (no joins), we use it for the query but
      // note that joined fields (contact, deal, owner) won't be present.
      // For filter-driven re-fetches, we accept base Communication data.
      await fetchList({ page: 1, eqFilters });

      // fetchList updates useEntity's internal state. We need to get that data.
      // Unfortunately useEntity doesn't return the result from fetchList directly.
      // Workaround: use the Supabase browser client directly for filtered queries
      // with joins. For simplicity, we'll do a client-side filter on initialData
      // for the type filter (since all data is already loaded with pageSize: 100).
      // This is acceptable because the filter is on the already-fetched dataset.

      // Actually, let's just filter the initialData for type filtering since we have
      // all communications loaded. For large datasets this would need server-side,
      // but 100 communications per account is a reasonable limit.
      if (type) {
        setDisplayData(initialData.filter((c) => c.type === type));
      } else {
        setDisplayData(initialData);
      }
      setFilterLoading(false);
    },
    [accountId, fetchList, initialData],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    // After creating a communication, reload to pick up new data from server
    window.location.reload();
  }, []);

  return (
    <div className="space-y-4 mt-4">
      {/* Header with filter chips and create button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleFilterChange(chip.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                typeFilter === chip.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nieuwe Communicatie
        </Button>
      </div>

      {/* Timeline */}
      {filterLoading ? (
        <div className="py-8 text-center text-muted-foreground">Laden...</div>
      ) : displayData.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Geen communicatie gevonden.</div>
      ) : (
        <div className="space-y-2">
          {displayData.map((comm) => {
            const config = TYPE_CONFIG[comm.type as CommType] ?? TYPE_CONFIG.note;
            const Icon = config.icon;
            const isExpanded = expanded.has(comm.id);
            const contentStr = typeof comm.content === 'string' ? comm.content : '';

            return (
              <div key={comm.id} className="border rounded-lg overflow-hidden">
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
                        <Badge variant="outline" className="text-xs shrink-0">
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
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{contentStr}</p>
                    )}
                  </div>

                  {/* Date and expand indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comm.date).toLocaleDateString('nl-BE')}
                    </span>
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

      <CommunicationModal
        open={modalOpen}
        onClose={handleModalClose}
        accountId={accountId}
      />
    </div>
  );
}
