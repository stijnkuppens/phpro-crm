'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/admin/role-guard';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { updateSettings } from '../actions/update-settings';
import type { SettingsValues } from '../types';

type Props = {
  initialData: SettingsValues;
};

export function SettingsForm({ initialData }: Props) {
  const [appName, setAppName] = useState(initialData.app_name);
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateSettings({ app_name: appName, logo_url: logoUrl });
    if (result.success) {
      toast.success('Instellingen opgeslagen');
    } else {
      toast.error(result.error as string);
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algemeen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="appName" className="text-sm font-medium">App Naam</label>
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
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Opslaan
          </Button>
        </RoleGuard>
      </CardContent>
    </Card>
  );
}
