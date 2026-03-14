'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient, withApiKey } from '@/lib/supabase/client';
import { FileCard } from './file-card';
import type { StorageFile } from '../types';

type FileGridProps = {
  files: StorageFile[];
  folders: string[];
  currentPath: string;
  selectedFiles: Set<string>;
  onToggleSelect: (name: string) => void;
  onSelectFile: (file: StorageFile) => void;
  onNavigateFolder: (name: string) => void;
};

function isImage(mimetype?: string) {
  return mimetype?.startsWith('image/') ?? false;
}

export function FileGrid({
  files,
  folders,
  currentPath,
  selectedFiles,
  onToggleSelect,
  onSelectFile,
  onNavigateFolder,
}: FileGridProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createBrowserClient();
    const imageFiles = files.filter((f) => isImage(f.metadata?.mimetype));
    if (imageFiles.length === 0) {
      setThumbnails({});
      return;
    }

    let cancelled = false;
    const paths = imageFiles.map((f) => (currentPath ? `${currentPath}/${f.name}` : f.name));
    supabase.storage
      .from('documents')
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        data?.forEach((item, i) => {
          if (item.signedUrl) map[imageFiles[i].name] = withApiKey(item.signedUrl);
        });
        setThumbnails(map);
      });

    return () => { cancelled = true; };
  }, [files, currentPath]);

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No files in this folder
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((name) => (
        <FileCard
          key={`folder-${name}`}
          name={name}
          isFolder
          selected={false}
          onSelect={() => onNavigateFolder(name)}
          onToggleSelect={() => {}}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.name}
          name={file.name}
          isFolder={false}
          mimetype={file.metadata?.mimetype}
          size={file.metadata?.size}
          thumbnailUrl={thumbnails[file.name]}
          selected={selectedFiles.has(file.name)}
          onSelect={() => onSelectFile(file)}
          onToggleSelect={() => onToggleSelect(file.name)}
        />
      ))}
    </div>
  );
}
