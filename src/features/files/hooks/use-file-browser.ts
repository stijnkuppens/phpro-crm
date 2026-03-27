'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { deleteFiles as deleteFilesAction } from '@/features/files/actions/delete-file';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageFile } from '../types';

/** Recursively list all file paths under a folder (including subfolders). */
async function listAllFiles(supabase: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!data) return [];

  const paths: string[] = [];
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // It's a folder — recurse
      const nested = await listAllFiles(supabase, bucket, fullPath);
      paths.push(...nested);
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

type UseFileBrowserReturn = {
  currentPath: string;
  navigateTo: (path: string) => void;
  breadcrumbs: { label: string; path: string }[];

  files: StorageFile[];
  folders: string[];
  loading: boolean;
  refresh: () => void;

  search: string;
  setSearch: (q: string) => void;

  selectedFiles: Set<string>;
  toggleSelect: (name: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  activeFile: StorageFile | null;
  setActiveFile: (file: StorageFile | null) => void;

  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  deleteFiles: (names: string[]) => Promise<void>;
  renameFile: (oldName: string, newName: string) => Promise<boolean>;
  moveFile: (fileName: string, targetFolder: string) => Promise<void>;
  renameFolder: (folderPath: string, newName: string) => Promise<boolean>;
  deleteFolder: (folderPath: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  treeKey: number;
};

export function useFileBrowser(initialFiles?: StorageFile[]): UseFileBrowserReturn {
  const supabase = createBrowserClient();
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<StorageFile[]>(
    initialFiles?.filter((f) => f.id !== null) ?? [],
  );
  const [folders, setFolders] = useState<string[]>(
    initialFiles?.filter((f) => f.id === null).map((f) => f.name) ?? [],
  );
  const [loading, setLoading] = useState(!initialFiles);
  const [search, setSearchRaw] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeFile, setActiveFile] = useState<StorageFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [treeKey, setTreeKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const skipInitialFetch = useRef(!!initialFiles);

  const fetchFolder = useCallback(
    async (path: string, searchQuery: string) => {
      setLoading(true);
      const { data, error } = await supabase.storage.from('documents').list(path || '', {
        limit: 200,
        sortBy: { column: 'name', order: 'asc' },
        search: searchQuery || undefined,
      });

      if (error) {
        toast.error('Failed to load files');
        setLoading(false);
        return;
      }

      const items = (data ?? []) as unknown as StorageFile[];
      // Filter out placeholder files
      const filteredItems = items.filter((f) => f.name !== '.emptyFolderPlaceholder');
      setFolders(filteredItems.filter((f) => f.id === null).map((f) => f.name));
      setFiles(filteredItems.filter((f) => f.id !== null));
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchFolder(currentPath, search);
  }, [currentPath, search, fetchFolder]);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedFiles(new Set());
    setActiveFile(null);
    setSearchRaw('');
  }, []);

  const breadcrumbs = (() => {
    const parts = currentPath ? currentPath.split('/').filter(Boolean) : [];
    return [
      { label: 'Documents', path: '' },
      ...parts.map((part, i) => ({
        label: part,
        path: parts.slice(0, i + 1).join('/'),
      })),
    ];
  })();

  const setSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchRaw(q), 300);
  }, []);

  const toggleSelect = useCallback((name: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFiles(new Set(files.map((f) => f.name)));
  }, [files]);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const refresh = useCallback(() => {
    fetchFolder(currentPath, search);
    setTreeKey((k) => k + 1);
  }, [currentPath, search, fetchFolder]);

  const handleDeleteFiles = useCallback(
    async (names: string[]) => {
      const fullPaths = names.map((n) => (currentPath ? `${currentPath}/${n}` : n));
      try {
        await deleteFilesAction(fullPaths);
        toast.success(`Deleted ${names.length} file${names.length > 1 ? 's' : ''}`);
        setSelectedFiles(new Set());
        setActiveFile(null);
        refresh();
      } catch {
        toast.error('Failed to delete files');
      }
    },
    [currentPath, refresh],
  );

  const renameFile = useCallback(
    async (oldName: string, newName: string): Promise<boolean> => {
      const fromPath = currentPath ? `${currentPath}/${oldName}` : oldName;
      const toPath = currentPath ? `${currentPath}/${newName}` : newName;

      const { error } = await supabase.storage
        .from('documents')
        .move(fromPath, toPath);

      if (error) {
        toast.error('Failed to rename file');
        return false;
      }

      toast.success(`Renamed to "${newName}"`);
      refresh();
      return true;
    },
    [currentPath, refresh],
  );

  const moveFile = useCallback(
    async (fileName: string, targetFolder: string) => {
      const fromPath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const toPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;

      if (fromPath === toPath) return;

      const { error } = await supabase.storage
        .from('documents')
        .move(fromPath, toPath);

      if (error) {
        toast.error('Failed to move file');
        return;
      }

      toast.success(`Moved to ${targetFolder || 'root'}`);
      setActiveFile(null);
      refresh();
    },
    [currentPath, refresh],
  );

  const renameFolder = useCallback(
    async (folderPath: string, newName: string): Promise<boolean> => {
      const parentPath = folderPath.includes('/')
        ? folderPath.substring(0, folderPath.lastIndexOf('/'))
        : '';
      const newFolderPath = parentPath ? `${parentPath}/${newName}` : newName;

      if (folderPath === newFolderPath) return false;

      const allFiles = await listAllFiles(supabase, 'documents', folderPath);

      // Also include placeholders
      const { data: raw } = await supabase.storage.from('documents').list(folderPath, { limit: 1000 });
      const placeholders = (raw ?? [])
        .filter((f) => f.name === '.emptyFolderPlaceholder')
        .map(() => `${folderPath}/.emptyFolderPlaceholder`);
      const allPaths = [...allFiles, ...placeholders];

      if (allPaths.length === 0) {
        // Empty folder — just move the placeholder
        const { error } = await supabase.storage
          .from('documents')
          .move(`${folderPath}/.emptyFolderPlaceholder`, `${newFolderPath}/.emptyFolderPlaceholder`);
        if (error) {
          toast.error('Failed to rename folder');
          return false;
        }
      } else {
        // Move every file from old path to new path
        let failed = 0;
        for (const filePath of allPaths) {
          const relativePath = filePath.substring(folderPath.length);
          const newPath = `${newFolderPath}${relativePath}`;
          const { error } = await supabase.storage.from('documents').move(filePath, newPath);
          if (error) failed++;
        }
        if (failed > 0) {
          toast.error(`Failed to move ${failed} file(s)`);
          return false;
        }
      }

      toast.success(`Renamed to "${newName}"`);
      // If we were inside the renamed folder, navigate to the new path
      if (currentPath === folderPath || currentPath.startsWith(folderPath + '/')) {
        const newCurrent = currentPath.replace(folderPath, newFolderPath);
        setCurrentPath(newCurrent);
      }
      refresh();
      return true;
    },
    [currentPath, refresh],
  );

  const deleteFolder = useCallback(
    async (folderPath: string) => {
      const allFiles = await listAllFiles(supabase, 'documents', folderPath);

      // Include placeholders too
      const collectPlaceholders = async (prefix: string): Promise<string[]> => {
        const { data } = await supabase.storage.from('documents').list(prefix, { limit: 1000 });
        const result: string[] = [];
        for (const item of data ?? []) {
          const full = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.name === '.emptyFolderPlaceholder') {
            result.push(full);
          } else if (item.id === null) {
            result.push(...await collectPlaceholders(full));
          }
        }
        return result;
      };
      const placeholders = await collectPlaceholders(folderPath);
      const allPaths = [...allFiles, ...placeholders];

      if (allPaths.length === 0) {
        toast.error('Folder is already empty');
        return;
      }

      // Supabase remove accepts up to 100 at a time
      for (let i = 0; i < allPaths.length; i += 100) {
        const batch = allPaths.slice(i, i + 100);
        const { error } = await supabase.storage.from('documents').remove(batch);
        if (error) {
          toast.error('Failed to delete some files');
          return;
        }
      }

      toast.success(`Deleted folder "${folderPath.split('/').pop()}"`);
      // If we were inside the deleted folder, navigate to parent
      if (currentPath === folderPath || currentPath.startsWith(folderPath + '/')) {
        const parentPath = folderPath.includes('/')
          ? folderPath.substring(0, folderPath.lastIndexOf('/'))
          : '';
        setCurrentPath(parentPath);
      }
      setActiveFile(null);
      refresh();
    },
    [currentPath, refresh],
  );

  const createFolder = useCallback(
    async (name: string) => {
      const placeholderPath = currentPath
        ? `${currentPath}/${name}/.emptyFolderPlaceholder`
        : `${name}/.emptyFolderPlaceholder`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(placeholderPath, new Blob(['']), { upsert: true });

      if (error) {
        toast.error('Failed to create folder');
        return;
      }

      toast.success(`Folder "${name}" created`);
      setTreeKey((k) => k + 1);
      refresh();
    },
    [currentPath, refresh],
  );

  return {
    currentPath,
    navigateTo,
    breadcrumbs,
    files,
    folders,
    loading,
    refresh,
    search,
    setSearch,
    selectedFiles,
    toggleSelect,
    selectAll,
    clearSelection,
    activeFile,
    setActiveFile,
    viewMode,
    setViewMode,
    deleteFiles: handleDeleteFiles,
    renameFile,
    moveFile,
    renameFolder,
    deleteFolder,
    createFolder,
    treeKey,
  };
}
