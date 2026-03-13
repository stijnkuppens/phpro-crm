export type StorageFile = {
  name: string;
  id: string | null; // null for folder prefixes
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
};

export type FolderEntry = {
  name: string;
  path: string;
};
