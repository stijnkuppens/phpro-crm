'use client';

import { Badge } from '@/components/ui/badge';
import type { HrDocument } from '../types';

type Props = { documents: HrDocument[] };

export function EmployeeDocumentsTab({ documents }: Props) {
  if (!documents || documents.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Geen documenten beschikbaar.</p>;
  }

  const sorted = [...documents].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <div className="mt-4 space-y-2">
      {sorted.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded border p-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{doc.type}</Badge>
            <span className="text-sm font-medium">{doc.name}</span>
            <span className="text-xs text-muted-foreground">
              {doc.date ? new Date(doc.date).toLocaleDateString('nl-BE') : ''}
            </span>
          </div>
          {doc.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Download
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
