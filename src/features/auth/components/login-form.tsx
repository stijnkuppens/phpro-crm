'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';
import { useBrandTheme } from '@/lib/hooks/use-brand-theme';
import type { OAuthProvider } from '@/features/auth/queries/get-oauth-providers';
import type { Provider } from '@supabase/supabase-js';

type LoginFormProps = {
  oauthProviders?: OAuthProvider[];
};

export function LoginForm({ oauthProviders = [] }: LoginFormProps) {
  const router = useRouter();
  const { brand, setBrand, mounted } = useBrandTheme();
  const [oauthLoading, setOauthLoading] = useState(false);

  // Handle hash-based auth tokens (invite, magic link, recovery).
  // @supabase/ssr's createBrowserClient does NOT auto-detect hash fragments,
  // so we manually parse and call setSession().
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (!accessToken || !refreshToken) return;

    setOauthLoading(true);
    const supabase = createBrowserClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          toast.error('Sessie instellen mislukt');
          setOauthLoading(false);
          return;
        }
        // Clear hash from URL before redirecting
        window.history.replaceState(null, '', window.location.pathname);
        if (type === 'invite' || type === 'recovery') {
          router.replace('/reset-password');
        } else {
          router.replace('/admin');
        }
      });
  }, [router]);

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
      return null;
    }

    router.push('/admin');
    router.refresh();
    return null;
  }, null);

  const handleOAuthLogin = async (provider: string) => {
    setOauthLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error('Inloggen mislukt. Probeer het opnieuw.');
      setOauthLoading(false);
    }
  };

  const is25Carat = brand === '25carat';
  const brandName = is25Carat ? '25Carat' : 'PHPro';

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left panel: form ──────────────────────────────────────────────── */}
      <div className="flex w-full flex-col justify-between p-8 lg:w-1/2">
        {/* Logo */}
        <div>
          {mounted && (
            <Image
              src={is25Carat ? '/logos/25carat-wordmark.svg' : '/logos/phpro.svg'}
              alt={`${brandName} logo`}
              width={is25Carat ? 140 : 122}
              height={is25Carat ? 45 : 42}
              priority
            />
          )}
        </div>

        {/* Form — centered vertically */}
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Welkom terug</h1>
            <p className="mt-2 text-muted-foreground">
              Log in op je {brandName} CRM account
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="naam@voorbeeld.be"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Wachtwoord</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary-action hover:underline"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            <SubmitButton className="h-11 w-full" icon={<LogIn />} disabled={oauthLoading}>
              Inloggen
            </SubmitButton>
          </form>

          {oauthProviders.length > 0 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Of verder met
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    disabled={oauthLoading}
                    onClick={() => handleOAuthLogin(provider.id)}
                  >
                    {oauthLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <OAuthIcon provider={provider.id} />
                    )}
                    Doorgaan met {provider.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {brandName}. Alle rechten voorbehouden.
          </p>
          {mounted && (
            <button
              type="button"
              onClick={() => setBrand(is25Carat ? 'phpro' : '25carat')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Wissel naar {is25Carat ? 'PHPro' : '25Carat'}
            </button>
          )}
        </div>
      </div>

      {/* ── Right panel: hero image ───────────────────────────────────────── */}
      <div className={`relative hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center ${
        is25Carat ? 'bg-neutral-800' : 'bg-gray-100'
      }`}>
        <Image
          src={is25Carat ? '/login_25carat.webp' : '/mps_phpro.webp'}
          alt={`${brandName} team`}
          fill
          className="object-contain"
          priority
          sizes="50vw"
        />
      </div>
    </div>
  );
}

function OAuthIcon({ provider }: { provider: string }) {
  const cn = 'h-4 w-4';

  switch (provider) {
    case 'google':
      return (
        <svg className={cn} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case 'discord':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case 'github':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case 'azure':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="#00a4ef">
          <path d="M2 3h9l-5.5 17H2L7.5 3zM11 7h11l-8 14H7l4-14z" />
        </svg>
      );
    case 'apple':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    );
    default:
      return <LogIn className={cn} />;
  }
}
