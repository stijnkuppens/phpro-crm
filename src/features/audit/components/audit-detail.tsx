'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '../types';

type AuditDetailProps = {
  log: AuditLog | null;
  open: boolean;
  onCloseAction: () => void;
};

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/** Keys to hide from the diff display — internal/noisy fields */
const HIDDEN_KEYS = new Set(['ip_address', 'name', 'subject', 'title']);

/** Display-friendly label for a metadata key */
function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\bid\b/g, 'ID');
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Ja' : 'Nee';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

/**
 * Shows only the changed fields between `before` and `after`.
 * Compares only keys present in `after` (the submitted form fields),
 * plus any keys in `before` that were removed.
 */
function UpdateDiff({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const afterKeys = Object.keys(after);
  const changed = afterKeys.filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );

  if (changed.length === 0) {
    return <p className="text-sm text-muted-foreground">Geen wijzigingen.</p>;
  }

  return (
    <div className="space-y-2">
      {changed.map((key) => (
        <div key={key} className="rounded-md border p-3">
          <p className="mb-1.5 text-xs font-medium capitalize">{formatKey(key)}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Oud</span>
              <pre className="mt-0.5 whitespace-pre-wrap text-red-600 dark:text-red-400">
                {formatValue(before[key])}
              </pre>
            </div>
            <div>
              <span className="text-muted-foreground">Nieuw</span>
              <pre className="mt-0.5 whitespace-pre-wrap text-green-600 dark:text-green-400">
                {formatValue(after[key])}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Shows all fields of a created or deleted entity. */
function BodySnapshot({ data, variant }: { data: Record<string, unknown>; variant: 'created' | 'deleted' }) {
  const entries = Object.entries(data).filter(
    ([, val]) => val !== null && val !== undefined && val !== '',
  );

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Geen data.</p>;
  }

  const colorClass = variant === 'created'
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-1">
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="w-32 shrink-0 font-medium capitalize text-muted-foreground">{formatKey(key)}</span>
          <pre className={`whitespace-pre-wrap ${colorClass}`}>{formatValue(val)}</pre>
        </div>
      ))}
    </div>
  );
}

/** Renders extra metadata fields that aren't part of the diff (e.g. closed_type, reason). */
function ExtraMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const skip = new Set(['before', 'after', 'body', 'snapshot', ...HIDDEN_KEYS]);
  const extras = Object.entries(metadata).filter(([key]) => !skip.has(key));

  if (extras.length === 0) return null;

  return (
    <div className="space-y-1">
      {extras.map(([key, val]) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="w-32 shrink-0 font-medium capitalize text-muted-foreground">{formatKey(key)}</span>
          <pre className="whitespace-pre-wrap">{formatValue(val)}</pre>
        </div>
      ))}
    </div>
  );
}

export function AuditDetail({ log, open, onCloseAction }: AuditDetailProps) {
  if (!log) return null;

  const metadata = isRecord(log.metadata) ? log.metadata : {};
  const before = isRecord(metadata.before) ? metadata.before : null;
  const after = isRecord(metadata.after) ? metadata.after : null;
  const body = isRecord(metadata.body) ? metadata.body : null;
  const snapshot = isRecord(metadata.snapshot) ? metadata.snapshot : null;

  // Determine display mode
  const isUpdate = before !== null && after !== null;
  const isCreate = body !== null;
  const isDelete = snapshot !== null;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onCloseAction()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Audit Log Detail</SheetTitle>
          <SheetDescription>
            <Badge variant="secondary">{log.action}</Badge>
            {' '}on {log.entity ?? 'unknown'} at{' '}
            {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-muted-foreground">ID</dt>
            <dd className="font-mono text-xs">{log.id}</dd>

            <dt className="font-medium text-muted-foreground">User</dt>
            <dd className="font-mono text-xs">{log.user_id ?? 'system'}</dd>

            <dt className="font-medium text-muted-foreground">Entity ID</dt>
            <dd className="font-mono text-xs">{log.entity_id ?? '\u2014'}</dd>

            <dt className="font-medium text-muted-foreground">IP Address</dt>
            <dd className="font-mono text-xs">
              {(isRecord(log.metadata) ? (log.metadata as Record<string, unknown>).ip_address as string : null) ?? '\u2014'}
            </dd>
          </dl>

          {isUpdate && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Wijzigingen</h3>
              <UpdateDiff before={before} after={after} />
            </div>
          )}

          {isCreate && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Aangemaakt</h3>
              <BodySnapshot data={body} variant="created" />
            </div>
          )}

          {isDelete && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Verwijderd</h3>
              <BodySnapshot data={snapshot} variant="deleted" />
            </div>
          )}

          <ExtraMetadata metadata={metadata} />

          {!isUpdate && !isCreate && !isDelete && Object.keys(metadata).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Metadata</h3>
              <pre className="rounded-md border bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
