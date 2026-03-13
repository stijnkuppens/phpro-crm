'use client';

import { useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UseFileUploadOptions = {
  bucket: string;
  pathPrefix?: string;
  onUpload?: (path: string) => void;
};

export function useFileUpload({ bucket, pathPrefix, onUpload }: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File) => {
      const supabase = createBrowserClient();
      setUploading(true);
      setProgress(0);

      const path = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) {
        toast.error('Upload failed');
        setUploading(false);
        return null;
      }

      setProgress(100);
      setUploading(false);
      toast.success('File uploaded');
      onUpload?.(path);
      return path;
    },
    [bucket, pathPrefix, onUpload],
  );

  const uploadMany = useCallback(
    async (files: File[]) => {
      const supabase = createBrowserClient();
      setUploading(true);
      setProgress(0);

      let completed = 0;
      let failed = 0;

      for (const file of files) {
        const path = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true });

        if (error) {
          failed++;
        }
        completed++;
        setProgress(Math.round((completed / files.length) * 100));
      }

      setUploading(false);

      if (failed > 0) {
        toast.error(`${failed} of ${files.length} uploads failed`);
      } else {
        toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
      }

      onUpload?.('');
    },
    [bucket, pathPrefix, onUpload],
  );

  const remove = useCallback(
    async (path: string) => {
      const supabase = createBrowserClient();
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        toast.error('Failed to delete file');
        return false;
      }
      toast.success('File deleted');
      return true;
    },
    [bucket],
  );

  return { upload, uploadMany, remove, uploading, progress };
}
