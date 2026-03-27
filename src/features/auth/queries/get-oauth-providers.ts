import { cache } from 'react';
import { getServerEnv, getClientEnv } from '@/lib/env';

export type OAuthProvider = {
  id: string;
  name: string;
};

/** Provider display names for supported OAuth providers. */
const providerNames: Record<string, string> = {
  google: 'Google',
  discord: 'Discord',
  github: 'GitHub',
  azure: 'Microsoft',
  apple: 'Apple',
  facebook: 'Facebook',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  twitter: 'Twitter',
  slack: 'Slack',
  spotify: 'Spotify',
  linkedin_oidc: 'LinkedIn',
};

/**
 * Fetches enabled OAuth providers from Supabase GoTrue settings.
 * Returns only providers that are both enabled and have a known display name.
 */
export const getOAuthProviders = cache(async (): Promise<OAuthProvider[]> => {
  const env = getServerEnv();
  const clientEnv = getClientEnv();

  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        apikey: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const external: Record<string, boolean> = data?.external ?? {};

    return Object.entries(external)
      .filter(([key, enabled]) => enabled && key in providerNames)
      .map(([key]) => ({ id: key, name: providerNames[key] }));
  } catch {
    return [];
  }
});
