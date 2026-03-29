'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { InfoRow } from '@/components/admin/info-row';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Job } from '../types';
import {
  JOB_STATUS_STYLES,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  ENTITY_LABELS,
  FORMAT_LABELS,
} from '../types';

type JobDetailModalProps = {
  job: Job;
  open: boolean;
  onClose: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function JobDetailModal({ job, open, onClose }: JobDetailModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!job.file_path) return;

    setDownloading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(job.file_path, 60);

      if (error || !data?.signedUrl) {
        toast.error('Kon download link niet aanmaken');
        return;
      }

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = `export-${job.entity ?? 'data'}.${job.format ?? 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const title = `${JOB_TYPE_LABELS[job.type] ?? job.type} ${ENTITY_LABELS[job.entity ?? ''] ?? job.entity ?? ''}`.trim();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="space-y-2">
          <InfoRow label="Status">
            <StatusBadge colorMap={JOB_STATUS_STYLES} value={job.status}>
              {JOB_STATUS_LABELS[job.status]}
            </StatusBadge>
          </InfoRow>
          <InfoRow label="Formaat" value={job.format ? FORMAT_LABELS[job.format] : '-'} />
          <InfoRow
            label="Rijen"
            value={job.row_count !== null ? job.row_count.toLocaleString('nl-BE') : '-'}
          />
          {job.file_size !== null && (
            <InfoRow label="Grootte" value={formatBytes(job.file_size)} />
          )}
          <InfoRow label="Aangevraagd" value={formatDate(job.created_at)} />
          {job.started_at && (
            <InfoRow label="Gestart" value={formatDate(job.started_at)} />
          )}
          {job.completed_at && (
            <InfoRow label="Voltooid" value={formatDate(job.completed_at)} />
          )}
          {job.status === 'processing' && (
            <InfoRow label="Voortgang">
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{job.progress}%</span>
              </div>
            </InfoRow>
          )}
          {job.error && (
            <InfoRow label="Fout">
              <span className="text-sm text-destructive">{job.error}</span>
            </InfoRow>
          )}
        </div>

        {job.status === 'completed' && job.file_path && (
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full"
          >
            <Download />
            {downloading ? 'Downloaden...' : 'Download bestand'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
