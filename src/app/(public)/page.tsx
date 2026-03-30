import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        {process.env.NEXT_PUBLIC_APP_NAME ?? 'Welcome'}
      </h1>
      <p className="max-w-lg text-lg text-muted-foreground">
        A modern web application powered by Next.js and Supabase.
      </p>
      <div className="flex gap-4">
        <Link href="/admin">
          <Button size="lg">Go to Admin</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
