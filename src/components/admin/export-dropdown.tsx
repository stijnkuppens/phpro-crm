'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/admin/modal';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { createExportJob } from '@/features/jobs/actions/create-export-job';
import type { ExportColumn } from '@/features/jobs/types';

type ExportDropdownProps = {
  entity: string;
  columns: ExportColumn[];
  filters?: Record<string, unknown>;
  selectQuery?: string;
};

export function ExportDropdown({
  entity,
  columns,
  filters = {},
  selectQuery,
}: ExportDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(columns.map((c) => c.key)),
  );

  const toggleColumn = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedKeys.size === columns.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(columns.map((c) => c.key)));
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    const selectedColumns = columns.filter((c) => selectedKeys.has(c.key));
    if (selectedColumns.length === 0) {
      toast.error('Selecteer minimaal één kolom');
      return;
    }

    setLoading(true);
    try {
      // Build select query from selected columns only
      const selectedSelect = selectedColumns
        .map((c) => {
          // Find the matching segment in the original selectQuery for join paths
          // e.g. "owner.full_name" needs "owner:user_profiles!owner_id(full_name)"
          if (selectQuery && c.key.includes('.')) {
            const prefix = c.key.split('.')[0];
            const segments = selectQuery.split(',');
            const joinSegment = segments.find((s) => s.startsWith(`${prefix}:`));
            if (joinSegment) return joinSegment;
          }
          return c.key;
        })
        .join(',');

      const result = await createExportJob({
        entity,
        format,
        filters,
        columns: selectedColumns,
        selectQuery: selectedSelect,
      });

      if (result.error) {
        toast.error(
          typeof result.error === 'string' ? result.error : 'Export starten mislukt',
        );
        return;
      }

      setOpen(false);
      toast.success('Export gestart', {
        description: 'Je ontvangt een melding wanneer het bestand klaar is.',
        action: {
          label: 'Bekijk jobs',
          onClick: () => router.push('/admin/jobs'),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedKeys(new Set(columns.map((c) => c.key)));
          setOpen(true);
        }}
      >
        <Download />
        Exporteren
      </Button>

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Exporteren">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Kolommen</span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary-action hover:underline"
                >
                  {selectedKeys.size === columns.length ? 'Geen selecteren' : 'Alles selecteren'}
                </button>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedKeys.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedKeys.size} van {columns.length} kolommen geselecteerd
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={loading || selectedKeys.size === 0}
                onClick={() => handleExport('xlsx')}
              >
                <FileSpreadsheet />
                {loading ? 'Bezig...' : 'Excel (.xlsx)'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={loading || selectedKeys.size === 0}
                onClick={() => handleExport('csv')}
              >
                <FileText />
                {loading ? 'Bezig...' : 'CSV (.csv)'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
