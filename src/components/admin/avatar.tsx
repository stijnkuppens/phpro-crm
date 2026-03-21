'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient, withApiKey } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

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
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase.storage
      .from('avatars')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setUrl(withApiKey(data.signedUrl));
      });
    return () => { cancelled = true; };
  }, [path]);

  const hasImage = url && !error;

  return (
    <div className={cn(
      'flex shrink-0 items-center justify-center font-medium overflow-hidden bg-muted text-muted-foreground',
      round ? 'rounded-full' : 'rounded-md',
      sizes[size],
    )}>
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={fallback}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
