'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient, withApiKey } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileTypeIcon } from './file-type-icon';
import { Folder } from 'lucide-react';
import type { StorageFile } from '../types';

type FileListViewProps = {
  files: StorageFile[];
  folders: string[];
  currentPath: string;
  selectedFiles: Set<string>;
  onToggleSelect: (name: string) => void;
  onSelectAll: () => void;
  onSelectFile: (file: StorageFile) => void;
  onNavigateFolder: (name: string) => void;
};

function formatSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function FileListView({
  files,
  folders,
  currentPath,
  selectedFiles,
  onToggleSelect,
  onSelectAll,
  onSelectFile,
  onNavigateFolder,
}: FileListViewProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createBrowserClient();
    const imageFiles = files.filter((f) => f.metadata?.mimetype?.startsWith('image/'));
    if (imageFiles.length === 0) {
      setThumbnails({});
      return;
    }
    const paths = imageFiles.map((f) => (currentPath ? `${currentPath}/${f.name}` : f.name));
    supabase.storage
      .from('documents')
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((item, i) => {
          if (item.signedUrl) map[imageFiles[i].name] = withApiKey(item.signedUrl);
        });
        setThumbnails(map);
      });
  }, [files, currentPath]);

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No files in this folder
      </div>
    );
  }

  const allSelected = files.length > 0 && files.every((f) => selectedFiles.has(f.name));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => {
                  if (allSelected) {
                    // deselect via toggle each
                    files.forEach((f) => {
                      if (selectedFiles.has(f.name)) onToggleSelect(f.name);
                    });
                  } else {
                    onSelectAll();
                  }
                }}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-24">Size</TableHead>
            <TableHead className="w-32">Type</TableHead>
            <TableHead className="w-32">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map((name) => (
            <TableRow
              key={`folder-${name}`}
              className="cursor-pointer"
              onClick={() => onNavigateFolder(name)}
            >
              <TableCell />
              <TableCell>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span>{name}</span>
                </div>
              </TableCell>
              <TableCell>—</TableCell>
              <TableCell className="text-muted-foreground">Folder</TableCell>
              <TableCell>—</TableCell>
            </TableRow>
          ))}
          {files.map((file) => (
            <TableRow
              key={file.name}
              className="cursor-pointer"
              data-state={selectedFiles.has(file.name) && 'selected'}
              onClick={() => onSelectFile(file)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedFiles.has(file.name)}
                  onCheckedChange={() => onToggleSelect(file.name)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {thumbnails[file.name] ? (
                    <img
                      src={thumbnails[file.name]}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <FileTypeIcon mimetype={file.metadata?.mimetype} className="h-4 w-4" />
                  )}
                  <span className="truncate">{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{formatSize(file.metadata?.size)}</TableCell>
              <TableCell className="truncate text-muted-foreground">
                {file.metadata?.mimetype ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(file.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
