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
  onClose: () => void;
};

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function MetadataDiff({ metadata }: { metadata: Record<string, unknown> }) {
  const old = metadata.old;
  const updated = metadata.new;

  if (!isRecord(old) || !isRecord(updated)) {
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>;
  }

  const allKeys = Array.from(new Set([...Object.keys(old), ...Object.keys(updated)]));
  const changedKeys = allKeys.filter(
    (key) => JSON.stringify(old[key]) !== JSON.stringify(updated[key]),
  );

  if (changedKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No changes detected.</p>;
  }

  return (
    <div className="space-y-3">
      {changedKeys.map((key) => (
        <div key={key} className="rounded-md border p-3">
          <p className="mb-1 text-xs font-medium">{key}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Old:</span>
              <pre className="mt-0.5 whitespace-pre-wrap text-red-600 dark:text-red-400">
                {JSON.stringify(old[key], null, 2) ?? 'undefined'}
              </pre>
            </div>
            <div>
              <span className="text-muted-foreground">New:</span>
              <pre className="mt-0.5 whitespace-pre-wrap text-green-600 dark:text-green-400">
                {JSON.stringify(updated[key], null, 2) ?? 'undefined'}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditDetail({ log, open, onClose }: AuditDetailProps) {
  if (!log) return null;

  const metadata = isRecord(log.metadata) ? log.metadata : {};
  const hasDiff = isRecord(metadata.old) && isRecord(metadata.new);

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Audit Log Detail</SheetTitle>
          <SheetDescription>
            <Badge variant="secondary">{log.action}</Badge>
            {' '}on {log.entity_type ?? 'unknown'} at{' '}
            {new Date(log.created_at).toLocaleString()}
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
            <dd className="font-mono text-xs">{log.ip_address ?? '\u2014'}</dd>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-medium">
              {hasDiff ? 'Changes' : 'Metadata'}
            </h3>
            {hasDiff ? (
              <MetadataDiff metadata={metadata} />
            ) : Object.keys(metadata).length > 0 ? (
              <pre className="rounded-md border bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No metadata.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
