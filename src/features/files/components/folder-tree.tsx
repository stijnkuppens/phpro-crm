'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileIcon, Pencil, Trash2 } from 'lucide-react';
import type { StorageFile } from '../types';

type FolderTreeProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSelectFile?: (folderPath: string, fileName: string) => void;
  onRenameFolder?: (folderPath: string, newName: string) => Promise<boolean>;
  onDeleteFolder?: (folderPath: string) => Promise<void>;
};

type TreeNodeProps = {
  name: string;
  path: string;
  depth: number;
  currentPath: string;
  onNavigate: (path: string) => void;
  onSelectFile?: (folderPath: string, fileName: string) => void;
  onRenameFolder?: (folderPath: string, newName: string) => Promise<boolean>;
  onDeleteFolder?: (folderPath: string) => Promise<void>;
};

function parseListing(data: StorageFile[] | null) {
  const items = (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder');
  const folders = items.filter((f) => f.id === null).map((f) => f.name).sort((a, b) => a.localeCompare(b));
  const files = items.filter((f) => f.id !== null).map((f) => f.name).sort((a, b) => a.localeCompare(b));
  return { folders, files };
}

function TreeNode({ name, path, depth, currentPath, onNavigate, onSelectFile, onRenameFolder, onDeleteFolder }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = path === currentPath;

  async function handleExpand() {
    if (!loaded) {
      const supabase = createBrowserClient();
      const { data } = await supabase.storage.from('documents').list(path);
      const result = parseListing(data as StorageFile[] | null);
      setChildren(result.folders);
      setFiles(result.files);
      setLoaded(true);
    }
    setExpanded((prev) => !prev);
  }

  // Auto-fetch file count on mount (even when collapsed)
  useEffect(() => {
    if (!loaded) {
      let cancelled = false;
      const supabase = createBrowserClient();
      supabase.storage.from('documents').list(path).then(({ data }) => {
        if (cancelled) return;
        const result = parseListing(data as StorageFile[] | null);
        setChildren(result.folders);
        setFiles(result.files);
        setLoaded(true);
      });
      return () => { cancelled = true; };
    }
  }, [path, loaded]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleRename = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setDraft(name);
      setRenaming(false);
      return;
    }
    const ok = await onRenameFolder?.(path, trimmed);
    if (!ok) setDraft(name);
    setRenaming(false);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger
          className={`flex items-center gap-1 rounded-md ${isActive ? 'bg-accent' : ''}`}
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
            {renaming ? (
              <form
                className="flex flex-1 items-center"
                onSubmit={(e) => { e.preventDefault(); handleRename(); }}
              >
                <Input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(name); setRenaming(false); } }}
                  className="h-6 text-sm"
                />
              </form>
            ) : (
              <Button
                variant="ghost"
                className="h-7 flex-1 justify-start gap-1.5 px-1 font-normal"
                onClick={() => onNavigate(path)}
              >
                {expanded ? (
                  <FolderOpen className="size-4 shrink-0" />
                ) : (
                  <Folder className="size-4 shrink-0" />
                )}
                <span className="truncate">{name}</span>
                {loaded && (
                  <span className="text-xs text-muted-foreground">({files.length})</span>
                )}
              </Button>
            )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onRenameFolder && (
            <ContextMenuItem onClick={() => { setDraft(name); setRenaming(true); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Hernoemen
            </ContextMenuItem>
          )}
          {onDeleteFolder && (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Verwijderen
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {confirmDelete && (
        <ConfirmDialog
          title="Map verwijderen"
          description={`Delete "${name}" and all its contents? This cannot be undone.`}
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={async () => {
            await onDeleteFolder?.(path);
            setConfirmDelete(false);
          }}
        />
      )}

      {expanded && (
        <>
          {children.map((childName) => (
            <TreeNode
              key={childName}
              name={childName}
              path={path ? `${path}/${childName}` : childName}
              depth={depth + 1}
              currentPath={currentPath}
              onNavigate={onNavigate}
              onSelectFile={onSelectFile}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
          {files.map((fileName) => (
            <button
              key={fileName}
              type="button"
              className="flex w-full items-center gap-1.5 rounded-md py-0.5 text-left hover:bg-accent"
              style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
              onClick={() => onSelectFile?.(path, fileName)}
            >
              <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs text-muted-foreground">{fileName}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

export function FolderTree({ currentPath, onNavigate, onSelectFile, onRenameFolder, onDeleteFolder }: FolderTreeProps) {
  const [rootChildren, setRootChildren] = useState<string[]>([]);
  const [rootFiles, setRootFiles] = useState<string[]>([]);
  const [rootLoaded, setRootLoaded] = useState(false);
  const [rootExpanded, setRootExpanded] = useState(true);

  const isRootActive = currentPath === '';

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase.storage.from('documents').list('').then(({ data }) => {
      if (cancelled) return;
      const result = parseListing(data as StorageFile[] | null);
      setRootChildren(result.folders);
      setRootFiles(result.files);
      setRootLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleRootExpand() {
    if (!rootLoaded) {
      const supabase = createBrowserClient();
      const { data } = await supabase.storage.from('documents').list('');
      const result = parseListing(data as StorageFile[] | null);
      setRootChildren(result.folders);
      setRootFiles(result.files);
      setRootLoaded(true);
    }
    setRootExpanded((prev) => !prev);
  }

  return (
    <div>
      <div className={`flex items-center gap-1 rounded-md ${isRootActive ? 'bg-accent' : ''}`}>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 shrink-0"
          onClick={handleRootExpand}
        >
          {rootExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          className="h-7 flex-1 justify-start gap-1.5 px-1 font-normal"
          onClick={() => onNavigate('')}
        >
          {rootExpanded ? (
            <FolderOpen className="size-4 shrink-0" />
          ) : (
            <Folder className="size-4 shrink-0" />
          )}
          <span className="truncate">Documents</span>
          {rootLoaded && (
            <span className="text-xs text-muted-foreground">({rootFiles.length})</span>
          )}
        </Button>
      </div>
      {rootExpanded && (
        <>
          {rootChildren.map((name) => (
            <TreeNode
              key={name}
              name={name}
              path={name}
              depth={1}
              currentPath={currentPath}
              onNavigate={onNavigate}
              onSelectFile={onSelectFile}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
          {rootFiles.map((fileName) => (
            <button
              key={fileName}
              type="button"
              className="flex w-full items-center gap-1.5 rounded-md py-0.5 text-left hover:bg-accent"
              style={{ paddingLeft: `${1 * 16 + 20}px` }}
              onClick={() => onSelectFile?.('', fileName)}
            >
              <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs text-muted-foreground">{fileName}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
