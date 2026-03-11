'use client';

import { useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UseFileUploadOptions = {
  bucket: string;
  onUpload?: (path: string) => void;
};

export function useFileUpload({ bucket, onUpload }: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File) => {
      const supabase = createBrowserClient();
      setUploading(true);
      setProgress(0);

      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });

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
    [bucket, onUpload],
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

  return { upload, remove, uploading, progress };
}
