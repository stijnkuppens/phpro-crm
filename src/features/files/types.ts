export type StorageFile = {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
};
