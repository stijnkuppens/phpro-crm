'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/page-header';
import { RoleGuard } from '@/components/admin/role-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createBrowserClient();
  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value');
      if (data) {
        for (const row of data) {
          if (row.key === 'app_name') setAppName((row.value as { value?: string })?.value ?? '');
          if (row.key === 'logo_url') setLogoUrl((row.value as { value?: string })?.value ?? '');
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const upserts = [
      { key: 'app_name', value: { value: appName } },
      { key: 'logo_url', value: { value: logoUrl } },
    ];
    const { error } = await supabase.from('app_settings').upsert(upserts);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
    }
    setSaving(false);
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
      />
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="appName" className="text-sm font-medium">App Name</label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="logoUrl" className="text-sm font-medium">Logo URL</label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <RoleGuard permission="settings.write">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </RoleGuard>
        </CardContent>
      </Card>
    </div>
  );
}
