'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';
import { useBrandTheme } from '@/lib/hooks/use-brand-theme';

export function LoginForm() {
  const router = useRouter();
  const { brand, mounted } = useBrandTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  const is25Carat = brand === '25carat';
  const brandName = is25Carat ? '25Carat' : 'PHPro';

  return (
    <>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="naam@voorbeeld.be"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogIn />
              )}
              Inloggen
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {brandName}. Alle rechten voorbehouden.
        </p>
      </div>

      {/* ── Right panel: hero image ───────────────────────────────────────── */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src={is25Carat ? '/login_25carat.webp' : '/mps_phpro.webp'}
          alt={`${brandName} team`}
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 ${
            is25Carat
              ? 'bg-gradient-to-t from-amber-950/60 via-transparent to-amber-950/20'
              : 'bg-gradient-to-t from-lime-950/60 via-transparent to-lime-950/20'
          }`}
        />
      </div>
    </>
  );
}
