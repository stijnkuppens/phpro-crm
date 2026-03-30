'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { CommunicationWithDetails } from './types';
import { COMMUNICATION_TYPE_CONFIG } from './types';

export const communicationColumns: ColumnDef<CommunicationWithDetails>[] = [
  {
    id: 'type_icon',
    header: '',
    meta: { label: 'Type' },
    cell: ({ row }) => {
      const config = COMMUNICATION_TYPE_CONFIG[row.original.type] ?? COMMUNICATION_TYPE_CONFIG.note;
      const Icon = config.icon;
      return (
        <div className={`flex items-center justify-center h-8 w-8 rounded-md ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'subject',
    id: 'subject',
    meta: {
      label: 'Onderwerp',
      filter: { type: 'search', placeholder: 'Zoek communicatie...', searchColumns: ['subject', 'to'] },
    },
    header: 'Onderwerp',
  },
  {
    accessorFn: (row) => (row.contact ? `${row.contact.first_name} ${row.contact.last_name}` : ''),
    id: 'contact',
    meta: {
      label: 'Contact',
      filter: { type: 'select', filterKey: 'contact_id', placeholder: 'Alle contacten' },
    },
    header: 'Contact',
  },
  {
    accessorFn: (row) => row.deal?.title ?? '',
    id: 'deal',
    meta: {
      label: 'Deal',
      filter: { type: 'select', filterKey: 'deal_id', placeholder: 'Alle deals' },
    },
    header: 'Deal',
  },
  {
    accessorKey: 'date',
    id: 'date',
    meta: { label: 'Datum' },
    header: 'Datum',
    cell: ({ getValue }) => {
      const d = getValue<string>();
      if (!d) return '';
      const dt = new Date(d);
      return (
        <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary-action whitespace-nowrap">
          {dt.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
          <span className="ml-1.5 opacity-70">
            {dt.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </span>
      );
    },
  },
  {
    accessorFn: (row) => row.owner?.full_name ?? '',
    id: 'owner',
    meta: {
      label: 'Eigenaar',
      filter: { type: 'select', filterKey: 'owner_id', placeholder: 'Alle gebruikers' },
    },
    header: 'Eigenaar',
  },
];
