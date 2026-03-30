'use client';

import { Upload } from 'lucide-react';
import { type DragEvent, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/lib/hooks/use-file-upload';

type FileUploadProps = {
  bucket: string;
  currentPath?: string;
  accept?: string;
  maxSize?: number;
  onUpload?: (path: string) => void;
};

export default function FileUpload({
  bucket,
  currentPath,
  accept,
  maxSize = 5 * 1024 * 1024,
  onUpload,
}: FileUploadProps) {
  const { uploadMany, uploading, progress } = useFileUpload({ bucket, pathPrefix: currentPath, onUpload });
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const mb = (maxSize / 1024 / 1024).toFixed(0);
      const valid = files.filter((f) => {
        if (f.size > maxSize) {
          alert(`"${f.name}" is too large. Maximum size is ${mb}MB.`);
          return false;
        }
        return true;
      });
      if (valid.length > 0) await uploadMany(valid);
    },
    [uploadMany, maxSize],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles],
  );

  return (
    <Card
      className={`border-2 border-dashed ring-0 transition-colors ${
        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Drag and drop files here, or</p>
          <Button
            variant="link"
            className="relative p-0"
            disabled={uploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              if (accept) input.accept = accept;
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files ?? []);
                if (files.length > 0) handleFiles(files);
              };
              input.click();
            }}
          >
            click to browse
          </Button>
        </div>
        {uploading && (
          <div className="w-full max-w-xs">
            <Progress value={progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
