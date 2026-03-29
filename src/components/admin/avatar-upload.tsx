'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { createBrowserClient, withApiKey } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

type Props = {
  /** Current image path in storage (relative to bucket) */
  currentPath?: string | null;
  /** Fallback text when no image (e.g. initials) */
  fallback: string;
  /** Storage path prefix, e.g. "contacts/abc-123" */
  storagePath: string;
  /** Called with the new storage path after upload */
  onUploaded: (path: string) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Round shape — true for people, false for companies */
  round?: boolean;
};

const sizes = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-lg',
  lg: 'h-16 w-16 text-xl',
};

export function AvatarUpload({
  currentPath,
  fallback,
  storagePath,
  onUploaded,
  size = 'md',
  round = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [trackedPath, setTrackedPath] = useState(currentPath);

  // Reset when currentPath changes (setState during render is React's approved pattern)
  if (trackedPath !== currentPath) {
    setTrackedPath(currentPath);
    setImageUrl(null);
    setLoadError(false);
  }

  // Build signed URL for existing image
  useEffect(() => {
    if (!currentPath) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase.storage
      .from('avatars')
      .createSignedUrl(currentPath, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setImageUrl(withApiKey(data.signedUrl));
      });
    return () => { cancelled = true; };
  }, [currentPath]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_TYPES.has(file.type)) {
      toast.error('Alleen JPG, PNG of WebP');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Maximaal 2MB');
      return;
    }

    setUploading(true);
    const supabase = createBrowserClient();
    const ext = file.name.split('.').pop();
    const path = `${storagePath}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      toast.error('Upload mislukt');
      setUploading(false);
      return;
    }

    // Get signed URL for display
    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, 3600);

    if (data?.signedUrl) {
      setImageUrl(withApiKey(data.signedUrl));
      setLoadError(false);
    }

    setUploading(false);
    onUploaded(path);
  }

  const hasImage = imageUrl && !loadError;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'group relative flex shrink-0 items-center justify-center font-medium cursor-pointer overflow-hidden',
          'bg-muted text-muted-foreground',
          round ? 'rounded-full' : 'rounded-lg',
          sizes[size],
          uploading && 'opacity-50',
        )}
      >
        {hasImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={fallback}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setLoadError(true)}
          />
        ) : (
          fallback
        )}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100',
          round ? 'rounded-full' : 'rounded-lg',
        )}>
          <Camera className="h-4 w-4 text-white" />
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
