'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/use-auth';
import { createBrowserClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/admin/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, User, Globe, Sun, Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandSwitcher } from '@/components/layout/brand-switcher';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { useTheme } from 'next-themes';

const emptySubscribe = () => () => {};

function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <button
      onClick={() => switchLocale(locale === 'nl' ? 'en' : 'nl')}
      className="rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-accent"
      type="button"
    >
      {locale === 'nl' ? 'EN' : 'NL'}
    </button>
  );
}

export function AdminTopbar() {
  const { user } = useAuth();
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const switchLocale = () => {
    const newLocale = locale === 'nl' ? 'en' : 'nl';
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 sm:gap-4 sm:px-4">
      <SidebarTrigger />
      <div className="flex-1" />
      {/* Desktop: show all controls inline */}
      <div className="hidden sm:contents">
        <BrandSwitcher />
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
      <NotificationBell />
      {mounted && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar path={user?.user_metadata?.avatar_url} fallback={initials} size="sm" round />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.user_metadata?.full_name ?? 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
              <User className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            {/* Mobile-only: settings that are hidden from topbar */}
            <div className="sm:hidden">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={switchLocale}>
                <Globe className="mr-2 h-4 w-4" />
                {locale === 'nl' ? 'Switch to English' : 'Wissel naar Nederlands'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
