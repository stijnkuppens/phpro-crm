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
import { dealFormSchema, type DealFormValues } from '../types';
import { createDeal } from '../actions/create-deal';
import { updateDeal } from '../actions/update-deal';

type Props = {
  defaultValues?: Partial<DealFormValues> & { id?: string };
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
};

export function DealForm({ defaultValues, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState<string>(defaultValues?.origin ?? 'rechtstreeks');
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: DealFormValues = {
      title: formData.get('title') as string,
      account_id: formData.get('account_id') as string,
      pipeline_id: formData.get('pipeline_id') as string,
      stage_id: formData.get('stage_id') as string,
      amount: formData.get('amount') ? Number(formData.get('amount')) : undefined,
      close_date: (formData.get('close_date') as string) || undefined,
      probability: formData.get('probability') ? Number(formData.get('probability')) : undefined,
      owner_id: (formData.get('owner_id') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      contact_id: (formData.get('contact_id') as string) || undefined,
      lead_source: (formData.get('lead_source') as string) || undefined,
      origin: (formData.get('origin') as DealFormValues['origin']) || undefined,
      cronos_cc: (formData.get('cronos_cc') as string) || undefined,
      cronos_contact: (formData.get('cronos_contact') as string) || undefined,
      cronos_email: (formData.get('cronos_email') as string) || undefined,
      forecast_category: (formData.get('forecast_category') as DealFormValues['forecast_category']) || undefined,
    };

    const parsed = dealFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateDeal(defaultValues!.id!, parsed.data)
      : await createDeal(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Deal bijgewerkt' : 'Deal aangemaakt');
    const id = 'data' in result && result.data ? result.data.id : defaultValues?.id ?? '';
    if (onSuccess) {
      onSuccess(id);
    } else {
      router.push('/admin/deals');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="title">Titel *</Label>
          <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_id">Account ID *</Label>
          <Input id="account_id" name="account_id" defaultValue={defaultValues?.account_id ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_id">Contact ID</Label>
          <Input id="contact_id" name="contact_id" defaultValue={defaultValues?.contact_id ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pipeline_id">Pipeline ID *</Label>
          <Input id="pipeline_id" name="pipeline_id" defaultValue={defaultValues?.pipeline_id ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage_id">Stage ID *</Label>
          <Input id="stage_id" name="stage_id" defaultValue={defaultValues?.stage_id ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Bedrag</Label>
          <Input id="amount" name="amount" type="number" min="0" defaultValue={defaultValues?.amount ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Kans (%)</Label>
          <Input id="probability" name="probability" type="number" min="0" max="100" defaultValue={defaultValues?.probability ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="close_date">Sluitdatum</Label>
          <Input id="close_date" name="close_date" type="date" defaultValue={defaultValues?.close_date ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_id">Eigenaar ID</Label>
          <Input id="owner_id" name="owner_id" defaultValue={defaultValues?.owner_id ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead_source">Lead bron</Label>
          <Input id="lead_source" name="lead_source" defaultValue={defaultValues?.lead_source ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="origin">Origine</Label>
          <Select name="origin" defaultValue={defaultValues?.origin ?? 'rechtstreeks'} onValueChange={(v) => setOrigin(v ?? 'rechtstreeks')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rechtstreeks">Rechtstreeks</SelectItem>
              <SelectItem value="cronos">Cronos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="forecast_category">Forecast categorie</Label>
          <Select name="forecast_category" defaultValue={defaultValues?.forecast_category ?? ''}>
            <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Commit">Commit</SelectItem>
              <SelectItem value="Best Case">Best Case</SelectItem>
              <SelectItem value="Pipeline">Pipeline</SelectItem>
              <SelectItem value="Omit">Omit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {origin === 'cronos' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cronos_cc">Cronos CC</Label>
              <Input id="cronos_cc" name="cronos_cc" defaultValue={defaultValues?.cronos_cc ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cronos_contact">Cronos contact</Label>
              <Input id="cronos_contact" name="cronos_contact" defaultValue={defaultValues?.cronos_contact ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cronos_email">Cronos e-mail</Label>
              <Input id="cronos_email" name="cronos_email" type="email" defaultValue={defaultValues?.cronos_email ?? ''} />
            </div>
          </>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ''} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </form>
  );
}
