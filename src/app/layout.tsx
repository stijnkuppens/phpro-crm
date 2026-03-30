import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'PHPro CRM',
    template: '%s — PHPro CRM',
  },
  description: 'PHPro CRM application',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const brandTheme = cookieStore.get('brand-theme')?.value ?? 'phpro';

  return (
    <html lang={locale} className={cn('font-sans', geist.variable)} data-brand={brandTheme} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            <NuqsAdapter>{children}</NuqsAdapter>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
