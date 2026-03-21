'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FileTypeIcon } from './file-type-icon';
import { Download, Trash2, X, Pencil, Check, ImageIcon, FolderInput } from 'lucide-react';
import dynamic from 'next/dynamic';

const ImageEditorDialog = dynamic(
  () => import('./image-editor-dialog').then((m) => m.ImageEditorDialog),
  { ssr: false },
);
import { MoveFileDialog } from './move-file-dialog';
import type { StorageFile } from '../types';

type FileDetailPanelProps = {
  file: StorageFile;
  thumbnailUrl?: string;
  onClose: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onRename?: (newName: string) => Promise<boolean>;
  onSaveEdited?: (blob: Blob) => Promise<void>;
  onMove?: (targetFolder: string) => Promise<void>;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

export function FileDetailPanel({ file, thumbnailUrl, onClose, onDelete, onDownload, onRename, onSaveEdited, onMove }: FileDetailPanelProps) {
  const mimetype = file.metadata?.mimetype ?? null;
  const isImage = mimetype?.startsWith('image/') ?? false;
  const [editing, setEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [draft, setDraft] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(file.name);
    setEditing(false);
  }, [file.name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRename = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === file.name) {
      setDraft(file.name);
      setEditing(false);
      return;
    }
    const ok = await onRename?.(trimmed);
    if (ok) setEditing(false);
    else setDraft(file.name);
  };

  return (
    <Card className="relative flex flex-col">
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center gap-1 pr-8">
          {editing ? (
            <form
              className="flex flex-1 items-center gap-1"
              onSubmit={(e) => { e.preventDefault(); handleRename(); }}
            >
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(file.name); setEditing(false); } }}
                className="h-7 text-sm"
              />
              <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <Check className="h-3.5 w-3.5" />
              </Button>
            </form>
          ) : (
            <>
              <span className="font-medium truncate flex-1">{file.name}</span>
              {onRename && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setEditing(true)}
                  aria-label="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview */}
        {isImage && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            className="object-contain w-full max-h-48 rounded-md bg-muted"
          />
        ) : (
          <div className="flex items-center justify-center rounded-md bg-muted py-6">
            <FileTypeIcon mimetype={mimetype ?? ''} className="h-16 w-16" />
          </div>
        )}

        <Separator />

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Size</span>
            <span className="text-sm">
              {file.metadata?.size != null ? formatSize(file.metadata.size) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Type</span>
            <span className="text-sm">{mimetype ?? 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Created</span>
            <span className="text-sm">{formatDate(file.created_at)}</span>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isImage && thumbnailUrl && onSaveEdited && (
            <Button variant="outline" className="w-full" onClick={() => setEditorOpen(true)}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Edit Image
            </Button>
          )}
          {onMove && (
            <Button variant="outline" className="w-full" onClick={() => setMoveOpen(true)}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to…
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <ConfirmDialog
            title="Delete file"
            description={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
            onConfirm={onDelete}
            trigger={
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            }
          />
        </div>

        {isImage && thumbnailUrl && onSaveEdited && (
          <ImageEditorDialog
            open={editorOpen}
            onOpenChange={setEditorOpen}
            src={thumbnailUrl}
            fileName={file.name}
            onSave={onSaveEdited}
          />
        )}

        {onMove && (
          <MoveFileDialog
            open={moveOpen}
            onOpenChange={setMoveOpen}
            fileName={file.name}
            onMove={onMove}
          />
        )}
      </CardContent>
    </Card>
  );
}
