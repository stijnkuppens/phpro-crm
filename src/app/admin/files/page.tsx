'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createBrowserClient, withApiKey } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/page-header';
import { RoleGuard } from '@/components/admin/role-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import { useFileBrowser } from '@/features/files/hooks/use-file-browser';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { FolderTree } from '@/features/files/components/folder-tree';
import { FileToolbar } from '@/features/files/components/file-toolbar';
import { FileGrid } from '@/features/files/components/file-grid';
import { FileListView } from '@/features/files/components/file-list-view';
import { FileDetailPanel } from '@/features/files/components/file-detail-panel';
import { CreateFolderDialog } from '@/features/files/components/create-folder-dialog';

export default function FilesPage() {
  const supabase = createBrowserClient();
  const browser = useFileBrowser();
  const { uploadMany, uploading } = useFileUpload({
    bucket: 'documents',
    pathPrefix: browser.currentPath || undefined,
    onUpload: () => browser.refresh(),
  });
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [detailThumbnail, setDetailThumbnail] = useState<string | undefined>();
  const pendingFileRef = useRef<string | null>(null);

  // After navigation + file list loads, select the pending file from the tree
  useEffect(() => {
    if (pendingFileRef.current && !browser.loading) {
      const file = browser.files.find((f) => f.name === pendingFileRef.current);
      if (file) handleSelectFile(file);
      pendingFileRef.current = null;
    }
  }, [browser.files, browser.loading]);

  const handleSelectFile = useCallback(
    async (file: (typeof browser.files)[0]) => {
      browser.setActiveFile(file);
      // Generate thumbnail URL for images
      if (file.metadata?.mimetype?.startsWith('image/')) {
        const path = browser.currentPath ? `${browser.currentPath}/${file.name}` : file.name;
        const { data } = await supabase.storage.from('documents').createSignedUrl(path, 3600);
        setDetailThumbnail(data?.signedUrl ? withApiKey(data.signedUrl) : undefined);
      } else {
        setDetailThumbnail(undefined);
      }
    },
    [browser.currentPath, supabase],
  );

  const handleDownload = useCallback(
    async () => {
      if (!browser.activeFile) return;
      const path = browser.currentPath
        ? `${browser.currentPath}/${browser.activeFile.name}`
        : browser.activeFile.name;
      const { data } = await supabase.storage.from('documents').createSignedUrl(path, 60);
      if (data?.signedUrl) window.open(withApiKey(data.signedUrl), '_blank');
    },
    [browser.activeFile, browser.currentPath, supabase],
  );

  const handleRename = useCallback(
    async (newName: string) => {
      if (!browser.activeFile) return false;
      return browser.renameFile(browser.activeFile.name, newName);
    },
    [browser.activeFile, browser.renameFile],
  );

  const handleMove = useCallback(
    async (targetFolder: string) => {
      if (!browser.activeFile) return;
      await browser.moveFile(browser.activeFile.name, targetFolder);
    },
    [browser.activeFile, browser.moveFile],
  );

  const handleSaveEdited = useCallback(
    async (blob: Blob) => {
      if (!browser.activeFile) return;
      const path = browser.currentPath
        ? `${browser.currentPath}/${browser.activeFile.name}`
        : browser.activeFile.name;
      const { error } = await supabase.storage
        .from('documents')
        .upload(path, blob, { upsert: true });
      if (error) {
        const { toast } = await import('sonner');
        toast.error('Failed to save edited image');
        return;
      }
      const { toast } = await import('sonner');
      toast.success('Image saved');
      browser.refresh();
    },
    [browser.activeFile, browser.currentPath, supabase, browser.refresh],
  );

  const handleDeleteActive = useCallback(async () => {
    if (!browser.activeFile) return;
    await browser.deleteFiles([browser.activeFile.name]);
  }, [browser.activeFile, browser.deleteFiles]);

  const handleDeleteSelected = useCallback(async () => {
    await browser.deleteFiles(Array.from(browser.selectedFiles));
  }, [browser.selectedFiles, browser.deleteFiles]);

  const handleTreeSelectFile = useCallback(
    (folderPath: string, fileName: string) => {
      if (folderPath === browser.currentPath) {
        // Already in the right folder — select directly
        const file = browser.files.find((f) => f.name === fileName);
        if (file) handleSelectFile(file);
      } else {
        // Navigate first, then select after files load
        pendingFileRef.current = fileName;
        browser.navigateTo(folderPath);
      }
    },
    [browser.currentPath, browser.files, browser.navigateTo, handleSelectFile],
  );

  const handleNavigateFolder = useCallback(
    (name: string) => {
      const path = browser.currentPath ? `${browser.currentPath}/${name}` : name;
      browser.navigateTo(path);
    },
    [browser.currentPath, browser.navigateTo],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Files' }]}
        actions={
          <RoleGuard permission="files.write">
            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}>
              <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
              New Folder
            </Button>
          </RoleGuard>
        }
      />

      <div className="flex gap-4">
        {/* Left: Folder tree */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <FolderTree
            key={browser.treeKey}
            currentPath={browser.currentPath}
            onNavigate={browser.navigateTo}
            onSelectFile={handleTreeSelectFile}
            onRenameFolder={browser.renameFolder}
            onDeleteFolder={browser.deleteFolder}
          />
        </aside>

        {/* Center: Toolbar + Content */}
        <div className="min-w-0 flex-1 space-y-4">
          <FileToolbar
            breadcrumbs={browser.breadcrumbs}
            onNavigate={browser.navigateTo}
            search={browser.search}
            onSearchChange={browser.setSearch}
            viewMode={browser.viewMode}
            onViewModeChange={browser.setViewMode}
            onUploadFiles={uploadMany}
            uploading={uploading}
            selectedCount={browser.selectedFiles.size}
            onDeleteSelected={handleDeleteSelected}
          />

          {browser.loading ? (
            <Skeleton className="h-64 w-full" />
          ) : browser.viewMode === 'grid' ? (
            <FileGrid
              files={browser.files}
              folders={[]}
              currentPath={browser.currentPath}
              selectedFiles={browser.selectedFiles}
              onToggleSelect={browser.toggleSelect}
              onSelectFile={handleSelectFile}
              onNavigateFolder={handleNavigateFolder}
            />
          ) : (
            <FileListView
              files={browser.files}
              folders={[]}
              currentPath={browser.currentPath}
              selectedFiles={browser.selectedFiles}
              onToggleSelect={browser.toggleSelect}
              onSelectAll={browser.selectAll}
              onSelectFile={handleSelectFile}
              onNavigateFolder={handleNavigateFolder}
            />
          )}
        </div>

        {/* Right: Detail panel */}
        {browser.activeFile && (
          <aside className="hidden w-72 shrink-0 xl:block">
            <FileDetailPanel
              file={browser.activeFile}
              thumbnailUrl={detailThumbnail}
              onClose={() => browser.setActiveFile(null)}
              onDelete={handleDeleteActive}
              onDownload={handleDownload}
              onRename={handleRename}
              onMove={handleMove}
              onSaveEdited={handleSaveEdited}
            />
          </aside>
        )}
      </div>

      <CreateFolderDialog
        open={showNewFolder}
        onOpenChange={setShowNewFolder}
        onCreate={browser.createFolder}
      />
    </div>
  );
}
