'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient, withApiKey } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 3500 * 1000; // slightly less than the 3600s signed URL TTL

function getCachedUrl(path: string): string | null {
  const entry = urlCache.get(path);
  if (entry && Date.now() < entry.expiresAt) return entry.url;
  urlCache.delete(path);
  return null;
}

function setCachedUrl(path: string, url: string): void {
  urlCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}

type Props = {
  /** Storage path relative to avatars bucket */
  path?: string | null;
  /** Fallback text (initials) */
  fallback: string;
  size?: 'xs' | 'sm' | 'md';
  round?: boolean;
};

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
};

export function Avatar({ path, fallback, size = 'sm', round = true }: Props) {
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [currentPath, setCurrentPath] = useState(path);

  // Reset when path changes (setState during render is React's approved pattern)
  if (currentPath !== path) {
    setCurrentPath(path);
    setFetchedUrl(null);
    setError(false);
  }

  // Check cache synchronously during render
  const cachedUrl = path ? getCachedUrl(path) : null;

  useEffect(() => {
    if (!path || getCachedUrl(path)) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase.storage
      .from('avatars')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.signedUrl) {
          const finalUrl = withApiKey(data.signedUrl);
          setCachedUrl(path, finalUrl);
          setFetchedUrl(finalUrl);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const url = cachedUrl ?? fetchedUrl;
  const hasImage = url && !error;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-medium overflow-hidden bg-muted text-muted-foreground',
        round ? 'rounded-full' : 'rounded-md',
        sizes[size],
      )}
    >
      {hasImage ? (
        // biome-ignore lint/performance/noImgElement: signed Supabase storage URLs are incompatible with next/image
        <img src={url} alt={fallback} className="h-full w-full object-cover" onError={() => setError(true)} />
      ) : (
        fallback
      )}
    </div>
  );
}
