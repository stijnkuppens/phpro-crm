'use client';

import { useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Archives
  'application/zip',
  'application/gzip',
]);

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

type UseFileUploadOptions = {
  bucket: string;
  pathPrefix?: string;
  maxSize?: number;
  allowedTypes?: Set<string>;
  onUpload?: (path: string) => void;
};

function validateFile(
  file: File,
  maxSize: number,
  allowedTypes: Set<string>,
): string | null {
  if (file.size > maxSize) {
    const mb = (maxSize / 1024 / 1024).toFixed(0);
    return `"${file.name}" exceeds ${mb}MB limit`;
  }
  if (!allowedTypes.has(file.type)) {
    return `"${file.name}" has unsupported file type: ${file.type || 'unknown'}`;
  }
  return null;
}

export function useFileUpload({
  bucket,
  pathPrefix,
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = ALLOWED_MIME_TYPES,
  onUpload,
}: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file, maxSize, allowedTypes);
      if (validationError) {
        toast.error(validationError);
        return null;
      }

      const supabase = createBrowserClient();
      setUploading(true);
      setProgress(0);

      const path = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

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
    [bucket, pathPrefix, maxSize, allowedTypes, onUpload],
  );

  const uploadMany = useCallback(
    async (files: File[]) => {
      const valid: File[] = [];
      for (const file of files) {
        const validationError = validateFile(file, maxSize, allowedTypes);
        if (validationError) {
          toast.error(validationError);
        } else {
          valid.push(file);
        }
      }

      if (valid.length === 0) return;

      const supabase = createBrowserClient();
      setUploading(true);
      setProgress(0);

      let completed = 0;
      let failed = 0;

      await Promise.all(valid.map(async (file) => {
        const path = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            upsert: true,
            contentType: file.type,
          });

        if (error) failed++;
        completed++;
        setProgress(Math.round((completed / valid.length) * 100));
      }));

      setUploading(false);

      if (failed > 0) {
        toast.error(`${failed} of ${valid.length} uploads failed`);
      } else {
        toast.success(`${valid.length} file${valid.length > 1 ? 's' : ''} uploaded`);
      }

      onUpload?.('');
    },
    [bucket, pathPrefix, maxSize, allowedTypes, onUpload],
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
