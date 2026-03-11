'use client';

import { useCallback, useState, type DragEvent } from 'react';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';

type FileUploadProps = {
  bucket: string;
  accept?: string;
  maxSize?: number;
  onUpload?: (path: string) => void;
};

export default function FileUpload({
  bucket,
  accept,
  maxSize = 5 * 1024 * 1024,
  onUpload,
}: FileUploadProps) {
  const { upload, uploading, progress } = useFileUpload({ bucket, onUpload });
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (maxSize && file.size > maxSize) {
        const mb = (maxSize / 1024 / 1024).toFixed(0);
        alert(`File too large. Maximum size is ${mb}MB.`);
        return;
      }
      await upload(file);
    },
    [upload, maxSize],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        dragOver ? 'border-primary bg-primary/5' : 'border-muted'
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
          <p className="text-sm text-muted-foreground">
            Drag and drop a file here, or
          </p>
          <Button
            variant="link"
            className="relative p-0"
            disabled={uploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              if (accept) input.accept = accept;
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
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
