'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type BrandTheme = 'phpro' | '25carat';

const STORAGE_KEY = 'brand-theme';
const COOKIE_NAME = 'brand-theme';
const BRAND_CHANGE_EVENT = 'brand-theme-change';

function getBrandFromCookie(): BrandTheme | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? (match[1] as BrandTheme) : null;
}

function setBrandCookie(brand: BrandTheme) {
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not yet widely available; this is intentional client-side theme persistence
  document.cookie = `${COOKIE_NAME}=${brand};path=/;max-age=31536000;SameSite=Lax`;
}

// Module-level mutable snapshot for useSyncExternalStore
let currentBrand: BrandTheme | null = null;

function getSnapshot(): BrandTheme {
  if (currentBrand) return currentBrand;
  currentBrand = (localStorage.getItem(STORAGE_KEY) as BrandTheme) ?? getBrandFromCookie() ?? 'phpro';
  return currentBrand;
}

function getServerSnapshot(): BrandTheme {
  return 'phpro';
}

function subscribe(callback: () => void) {
  const onBrandChange = () => callback();
  window.addEventListener(BRAND_CHANGE_EVENT, onBrandChange);
  return () => window.removeEventListener(BRAND_CHANGE_EVENT, onBrandChange);
}

const emptySubscribe = () => () => {};

export function useBrandTheme() {
  const brand = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Keep data-brand attribute in sync
  useEffect(() => {
    document.documentElement.setAttribute('data-brand', brand);
  }, [brand]);

  const setBrand = useCallback((next: BrandTheme) => {
    currentBrand = next;
    localStorage.setItem(STORAGE_KEY, next);
    setBrandCookie(next);
    document.documentElement.setAttribute('data-brand', next);
    window.dispatchEvent(new CustomEvent(BRAND_CHANGE_EVENT, { detail: next }));
  }, []);

  return { brand, setBrand, mounted } as const;
}
