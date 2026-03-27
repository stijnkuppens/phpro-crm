'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Mail, FileText, Users, Phone } from 'lucide-react';
import type { CommunicationWithDetails } from './types';

const TYPE_CONFIG = {
  email: { icon: Mail, bg: 'bg-blue-50 dark:bg-blue-950', color: 'text-blue-600 dark:text-blue-400', label: 'E-mail' },
  note: { icon: FileText, bg: 'bg-amber-50 dark:bg-amber-950', color: 'text-amber-600 dark:text-amber-400', label: 'Notitie' },
  meeting: { icon: Users, bg: 'bg-green-50 dark:bg-green-950', color: 'text-green-600 dark:text-green-400', label: 'Vergadering' },
  call: { icon: Phone, bg: 'bg-purple-50 dark:bg-purple-950', color: 'text-purple-600 dark:text-purple-400', label: 'Call' },
} as const;

type CommType = keyof typeof TYPE_CONFIG;

export { TYPE_CONFIG };

export const communicationColumns: ColumnDef<CommunicationWithDetails>[] = [
  {
    id: 'type_icon',
    header: '',
    meta: { label: 'Type' },
    cell: ({ row }) => {
      const config = TYPE_CONFIG[row.original.type as CommType] ?? TYPE_CONFIG.note;
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
    accessorFn: (row) =>
      row.contact ? `${row.contact.first_name} ${row.contact.last_name}` : '',
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
