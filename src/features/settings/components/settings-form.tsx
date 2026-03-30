'use client';

import { Save } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { RoleGuard } from '@/components/admin/role-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { updateSettings } from '../actions/update-settings';
import type { SettingsValues } from '../types';

type Props = {
  initialData: SettingsValues;
};

export function SettingsForm({ initialData }: Props) {
  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const result = await updateSettings({
      app_name: formData.get('app_name') as string,
      logo_url: formData.get('logo_url') as string,
    });
    if (result.success) {
      toast.success('Instellingen opgeslagen');
    } else {
      toast.error(result.error as string);
    }
    return null;
  }, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algemeen</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="app_name" className="text-sm font-medium">
              App Naam
            </label>
            <Input id="app_name" name="app_name" defaultValue={initialData.app_name} />
          </div>
          <div className="space-y-2">
            <label htmlFor="logo_url" className="text-sm font-medium">
              Logo URL
            </label>
            <Input id="logo_url" name="logo_url" defaultValue={initialData.logo_url} placeholder="https://..." />
          </div>
          <RoleGuard permission="settings.write">
            <SubmitButton icon={<Save />}>Opslaan</SubmitButton>
          </RoleGuard>
        </CardContent>
      </form>
    </Card>
  );
}
