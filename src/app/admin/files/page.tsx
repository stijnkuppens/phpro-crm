import { FileBrowser } from '@/features/files/components/file-browser';
import { getFiles } from '@/features/files/queries/get-files';

export default async function FilesPage() {
  const initialFiles = await getFiles();

  return (
    <div className="space-y-6">
      <FileBrowser initialFiles={initialFiles} />
    </div>
  );
}
