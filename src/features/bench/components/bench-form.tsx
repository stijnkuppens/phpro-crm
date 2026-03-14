'use client';

import { useState } from 'react';
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
import { benchConsultantFormSchema, type BenchConsultantFormValues, type LanguageFormValues } from '../types';
import { createBenchConsultant } from '../actions/create-bench-consultant';
import { updateBenchConsultant } from '../actions/update-bench-consultant';

type Props = {
  defaultValues?: Partial<BenchConsultantFormValues> & { id?: string };
  defaultLanguages?: LanguageFormValues[];
  onSuccess?: () => void;
};

export function BenchForm({ defaultValues, defaultLanguages, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<LanguageFormValues[]>(defaultLanguages ?? []);
  const isEdit = !!defaultValues?.id;

  function addLanguage() {
    setLanguages((prev) => [...prev, { language: '', level: 'Basis' }]);
  }

  function removeLanguage(index: number) {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLanguage(index: number, field: keyof LanguageFormValues, value: string) {
    setLanguages((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rolesRaw = (formData.get('roles') as string) || '';
    const techsRaw = (formData.get('technologies') as string) || '';

    const values: BenchConsultantFormValues = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      city: (formData.get('city') as string) || undefined,
      priority: (formData.get('priority') as 'High' | 'Medium' | 'Low') ?? 'Medium',
      available_date: (formData.get('available_date') as string) || null,
      min_hourly_rate: formData.get('min_hourly_rate') ? Number(formData.get('min_hourly_rate')) : null,
      max_hourly_rate: formData.get('max_hourly_rate') ? Number(formData.get('max_hourly_rate')) : null,
      roles: rolesRaw ? rolesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      technologies: techsRaw ? techsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      description: (formData.get('description') as string) || undefined,
      cv_pdf_url: (formData.get('cv_pdf_url') as string) || null,
    };

    const parsed = benchConsultantFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const validLanguages = languages.filter((l) => l.language.trim().length > 0);

    const result = isEdit
      ? await updateBenchConsultant(defaultValues!.id!, parsed.data, validLanguages)
      : await createBenchConsultant(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Consultant bijgewerkt' : 'Consultant aangemaakt');
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Voornaam *</Label>
          <Input id="first_name" name="first_name" defaultValue={defaultValues?.first_name ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Achternaam *</Label>
          <Input id="last_name" name="last_name" defaultValue={defaultValues?.last_name ?? ''} required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Stad</Label>
          <Input id="city" name="city" defaultValue={defaultValues?.city ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioriteit</Label>
          <Select name="priority" defaultValue={defaultValues?.priority ?? 'Medium'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="available_date">Beschikbaar vanaf</Label>
          <Input id="available_date" name="available_date" type="date" defaultValue={defaultValues?.available_date ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_hourly_rate">Min uurtarief (€)</Label>
          <Input id="min_hourly_rate" name="min_hourly_rate" type="number" defaultValue={defaultValues?.min_hourly_rate ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_hourly_rate">Max uurtarief (€)</Label>
          <Input id="max_hourly_rate" name="max_hourly_rate" type="number" defaultValue={defaultValues?.max_hourly_rate ?? ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="roles">Rollen (komma-gescheiden)</Label>
        <Input id="roles" name="roles" defaultValue={defaultValues?.roles?.join(', ') ?? ''} placeholder="Dev Senior, Tech Lead" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="technologies">Technologieën (komma-gescheiden)</Label>
        <Input id="technologies" name="technologies" defaultValue={defaultValues?.technologies?.join(', ') ?? ''} placeholder="PHP, React, Docker" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={defaultValues?.description ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cv_pdf_url">CV URL</Label>
        <Input id="cv_pdf_url" name="cv_pdf_url" defaultValue={defaultValues?.cv_pdf_url ?? ''} />
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Talen</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLanguage}>+ Taal</Button>
        </div>
        {languages.map((lang, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={lang.language}
              onChange={(e) => updateLanguage(i, 'language', e.target.value)}
              placeholder="Taal"
              className="flex-1"
            />
            <Select value={lang.level} onValueChange={(v) => { if (v) updateLanguage(i, 'level', v); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Basis">Basis</SelectItem>
                <SelectItem value="Gevorderd">Gevorderd</SelectItem>
                <SelectItem value="Vloeiend">Vloeiend</SelectItem>
                <SelectItem value="Moedertaal">Moedertaal</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeLanguage(i)}>✕</Button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
      </Button>
    </form>
  );
}
