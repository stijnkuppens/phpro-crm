'use client';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Folder } from 'lucide-react';
import { FileTypeIcon } from './file-type-icon';

type FileCardProps = {
  name: string;
  isFolder: boolean;
  mimetype?: string;
  size?: number;
  thumbnailUrl?: string;
  selected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function FileCard({
  name,
  isFolder,
  mimetype,
  size,
  thumbnailUrl,
  selected,
  onSelect,
  onToggleSelect,
}: FileCardProps) {
  return (
    <Card
      className={`group cursor-pointer relative pt-0 gap-0 ${selected ? 'ring-primary' : ''}`}
      onClick={onSelect}
    >
      <div
        className={`absolute top-2 left-2 z-10 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <Checkbox
          checked={selected}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        />
      </div>

      <div className="aspect-square overflow-hidden rounded-t-xl bg-muted">
        {isFolder ? (
          <div className="flex h-full items-center justify-center">
            <Folder className="size-12 text-muted-foreground" />
          </div>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileTypeIcon mimetype={mimetype ?? ''} className="size-12" />
          </div>
        )}
      </div>

      <div className="px-2 py-1.5">
        <p className="truncate text-sm font-medium">{name}</p>
        {size !== undefined && (
          <p className="text-xs text-muted-foreground">{formatSize(size)}</p>
        )}
      </div>
    </Card>
  );
}
