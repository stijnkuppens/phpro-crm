'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import type { StorageFile } from '../types';

type MoveFileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onMove: (targetFolder: string) => Promise<void>;
};

function parseFolders(data: StorageFile[] | null): string[] {
  return (data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder' && f.id === null)
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b));
}

function FolderPickerNode({
  name,
  path,
  depth,
  selected,
  onSelect,
}: {
  name: string;
  path: string;
  depth: number;
  selected: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const isSelected = path === selected;

  const handleExpand = useCallback(async () => {
    if (!loaded) {
      const supabase = createBrowserClient();
      const { data } = await supabase.storage.from('documents').list(path);
      setChildren(parseFolders(data as StorageFile[] | null));
      setLoaded(true);
    }
    setExpanded((prev) => !prev);
  }, [path, loaded]);

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md px-1 py-0.5 ${isSelected ? 'bg-accent' : 'hover:bg-muted'}`}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-5 shrink-0"
          onClick={handleExpand}
        >
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </Button>
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 text-left text-sm"
          onClick={() => onSelect(path)}
        >
          {expanded ? (
            <FolderOpen className="size-4 shrink-0" />
          ) : (
            <Folder className="size-4 shrink-0" />
          )}
          <span className="truncate">{name}</span>
        </button>
      </div>
      {expanded &&
        children.map((child) => (
          <FolderPickerNode
            key={child}
            name={child}
            path={path ? `${path}/${child}` : child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function MoveFileDialog({ open, onOpenChange, fileName, onMove }: MoveFileDialogProps) {
  const [selected, setSelected] = useState('');
  const [rootFolders, setRootFolders] = useState<string[]>([]);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected('');
    const supabase = createBrowserClient();
    supabase.storage
      .from('documents')
      .list('')
      .then(({ data }) => setRootFolders(parseFolders(data as StorageFile[] | null)));
  }, [open]);

  const handleMove = async () => {
    setMoving(true);
    try {
      await onMove(selected);
      onOpenChange(false);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move "{fileName}"</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto rounded-md border p-2">
          {/* Root option */}
          <button
            type="button"
            className={`flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-sm ${selected === '' ? 'bg-accent' : 'hover:bg-muted'}`}
            onClick={() => setSelected('')}
          >
            <Folder className="size-4 shrink-0" />
            <span>Documents (root)</span>
          </button>

          {rootFolders.map((name) => (
            <FolderPickerNode
              key={name}
              name={name}
              path={name}
              depth={1}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={moving}>
            {moving ? 'Moving…' : 'Move here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
