'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { accountFormSchema, type AccountFormValues } from '../types';
import { createAccount } from '../actions/create-account';
import { updateAccount } from '../actions/update-account';

type Props = {
  defaultValues?: Partial<AccountFormValues> & { id?: string };
  onSuccess?: () => void;
};

export function AccountForm({ defaultValues, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: AccountFormValues = {
      name: formData.get('name') as string,
      type: (formData.get('type') as AccountFormValues['type']) ?? 'Prospect',
      status: (formData.get('status') as AccountFormValues['status']) ?? 'Actief',
      domain: (formData.get('domain') as string) || undefined,
      industry: (formData.get('industry') as string) || undefined,
      size: (formData.get('size') as string) || undefined,
      revenue: formData.get('revenue') ? Number(formData.get('revenue')) : undefined,
      phone: (formData.get('phone') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      country: (formData.get('country') as string) || undefined,
      vat_number: (formData.get('vat_number') as string) || undefined,
      about: (formData.get('about') as string) || undefined,
    };

    const parsed = accountFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateAccount(defaultValues!.id!, parsed.data)
      : await createAccount(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Account bijgewerkt' : 'Account aangemaakt');
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/admin/accounts');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Naam *</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Domein</Label>
          <Input id="domain" name="domain" defaultValue={defaultValues?.domain ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? 'Prospect'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Klant">Klant</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
              <SelectItem value="Partner">Partner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? 'Actief'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Actief">Actief</SelectItem>
              <SelectItem value="Inactief">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Sector</Label>
          <Input id="industry" name="industry" defaultValue={defaultValues?.industry ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Land</Label>
          <Input id="country" name="country" defaultValue={defaultValues?.country ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefoon</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={defaultValues?.website ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vat_number">BTW-nummer</Label>
          <Input id="vat_number" name="vat_number" defaultValue={defaultValues?.vat_number ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="revenue">Omzet</Label>
          <Input id="revenue" name="revenue" type="number" defaultValue={defaultValues?.revenue ?? ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="about">Over</Label>
        <Textarea id="about" name="about" rows={4} defaultValue={defaultValues?.about ?? ''} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
      </Button>
    </form>
  );
}
