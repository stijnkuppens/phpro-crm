'use client';

import { useCallback, useEffect, useState } from 'react';

export type BrandTheme = 'phpro' | '25carat';

const STORAGE_KEY = 'brand-theme';
const COOKIE_NAME = 'brand-theme';

function getBrandFromCookie(): BrandTheme | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? (match[1] as BrandTheme) : null;
}

function setBrandCookie(brand: BrandTheme) {
  document.cookie = `${COOKIE_NAME}=${brand};path=/;max-age=31536000;SameSite=Lax`;
}

export function useBrandTheme() {
  const [brand, setBrandState] = useState<BrandTheme>('phpro');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored =
      (localStorage.getItem(STORAGE_KEY) as BrandTheme) ??
      getBrandFromCookie() ??
      'phpro';
    setBrandState(stored);
    document.documentElement.setAttribute('data-brand', stored);
    setMounted(true);
  }, []);

  const setBrand = useCallback((next: BrandTheme) => {
    setBrandState(next);
    localStorage.setItem(STORAGE_KEY, next);
    setBrandCookie(next);
    document.documentElement.setAttribute('data-brand', next);
  }, []);

  return { brand, setBrand, mounted } as const;
}
