import type { Metadata } from 'next';

type MetadataInput = {
  title: string;
  description?: string;
};

/**
 * Create a Next.js Metadata object with consistent defaults.
 * The root layout already sets `title.template: '%s — PHPro CRM'`,
 * so pages only need to provide the page-specific title segment.
 *
 * Usage:
 *   export const metadata = createMetadata({ title: 'Accounts' });
 *   export const metadata = createMetadata({ title: 'Dashboard', description: 'Overzicht' });
 */
export function createMetadata({ title, description }: MetadataInput): Metadata {
  return {
    title,
    ...(description && { description }),
    formatDetection: { telephone: false },
  };
}
