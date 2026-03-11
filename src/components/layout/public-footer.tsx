export function PublicFooter() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME ?? 'My App'}. All rights reserved.
      </div>
    </footer>
  );
}
