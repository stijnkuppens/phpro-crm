'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/page-header';
import { RoleGuard } from '@/components/admin/role-guard';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

const FileUpload = dynamic(() => import('@/components/admin/file-upload'), {
  loading: () => <Skeleton className="h-48 w-full" />,
});

import type { StorageFile } from '@/features/files/types';

export default function FilesPage() {
  const supabase = createBrowserClient();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('documents').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (!error && data) setFiles(data as unknown as StorageFile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDelete = async (name: string) => {
    const { error } = await supabase.storage.from('documents').remove([name]);
    if (error) {
      toast.error('Failed to delete file');
      return;
    }
    toast.success('File deleted');
    loadFiles();
  };

  const handleDownload = async (name: string) => {
    const { data } = await supabase.storage.from('documents').createSignedUrl(name, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Files' }]}
      />
      <RoleGuard permission="files.write">
        <FileUpload bucket="documents" onUpload={() => loadFiles()} />
      </RoleGuard>
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No files uploaded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.metadata?.size
                      ? `${(file.metadata.size / 1024).toFixed(1)} KB`
                      : '—'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(file.name)}>
                  <Download className="h-4 w-4" />
                </Button>
                <RoleGuard permission="files.delete">
                  <ConfirmDialog
                    title="Delete file?"
                    description={`This will permanently delete ${file.name}.`}
                    onConfirm={() => handleDelete(file.name)}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    }
                  />
                </RoleGuard>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
