'use client';

import { useRef, useState } from 'react';
import { FileUp, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@/lib/supabase/client';

type PdfUploadFieldProps = {
  value: string;
  onChange: (path: string) => void;
  bucket?: string;
  folder?: string;
  className?: string;
};

export function PdfUploadField({ value, onChange, bucket = 'documents', folder = '', className }: PdfUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const displayName = value ? value.split('/').pop() ?? value : '';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowed.includes(file.type)) {
      toast.error('Bestandstype niet ondersteund');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bestand mag niet groter zijn dan 10MB');
      return;
    }

    setUploading(true);
    try {
      const supabase = createBrowserClient();
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
      if (error) throw error;

      onChange(path);
      toast.success('Bestand geüpload');
    } catch {
      toast.error('Upload mislukt');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border bg-white dark:bg-background px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{displayName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            readOnly
            placeholder="Geen bestand gekozen"
            className="flex-1 cursor-pointer bg-white dark:bg-background"
            onClick={() => inputRef.current?.click()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <FileUp className="h-3.5 w-3.5" />
            {uploading ? 'Uploaden...' : 'Upload'}
          </Button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
