'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createExportJob } from '@/features/jobs/actions/create-export-job';
import type { ExportColumn } from '@/features/jobs/types';

type ExportDropdownProps = {
  entity: string;
  columns: ExportColumn[];
  getFilters: () => Record<string, unknown>;
  selectQuery?: string;
};

export function ExportDropdown({
  entity,
  columns,
  getFilters,
  selectQuery,
}: ExportDropdownProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setLoading(true);
    try {
      const result = await createExportJob({
        entity,
        format,
        filters: getFilters(),
        columns,
        selectQuery,
      });

      if (result.error) {
        toast.error(
          typeof result.error === 'string' ? result.error : 'Export starten mislukt',
        );
        return;
      }

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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={loading}>
            <Download />
            {loading ? 'Bezig...' : 'Exporteren'}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
