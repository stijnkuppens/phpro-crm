'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { LayoutGrid, List, Upload, Trash2, ChevronRight } from 'lucide-react';

type FileToolbarProps = {
  breadcrumbs: { label: string; path: string }[];
  onNavigate: (path: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onUploadFiles: (files: File[]) => void;
  uploading?: boolean;
  selectedCount: number;
  onDeleteSelected: () => void;
};

export function FileToolbar({
  breadcrumbs,
  onNavigate,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onUploadFiles,
  uploading,
  selectedCount,
  onDeleteSelected,
}: FileToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <button
              onClick={() => onNavigate(crumb.path)}
              className={
                i === breadcrumbs.length - 1
                  ? 'font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </nav>

      {/* Toolbar row */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search files..."
          defaultValue={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />

        <div className="flex-1" />

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <ConfirmDialog
              title="Delete files?"
              description={`This will permanently delete ${selectedCount} file${selectedCount > 1 ? 's' : ''}. This action cannot be undone.`}
              onConfirm={onDeleteSelected}
              trigger={
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              }
            />
          </div>
        )}

        <div className="flex items-center rounded-lg border">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none border-0"
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none border-0"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button
          size="sm"
          disabled={uploading}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files ?? []);
              if (files.length > 0) onUploadFiles(files);
            };
            input.click();
          }}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload
        </Button>
      </div>
    </div>
  );
}
