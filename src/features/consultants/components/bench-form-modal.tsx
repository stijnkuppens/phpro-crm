'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Modal } from '@/components/admin/modal';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { PdfUploadField } from '@/components/admin/pdf-upload-field';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { benchConsultantFormSchema, type BenchConsultantFormValues, type ConsultantWithDetails, type LanguageFormValues } from '../types';
import { createBenchConsultant } from '../actions/create-bench-consultant';
import { updateConsultant } from '../actions/update-consultant';

type Props = {
  open: boolean;
  onClose: () => void;
  consultant?: ConsultantWithDetails;
};

export function BenchFormModal({ open, onClose, consultant }: Props) {
  const isEdit = !!consultant;
  const [cvUrl, setCvUrl] = useState(consultant?.cv_pdf_url ?? '');
  const [avatarPath, setAvatarPath] = useState(consultant?.avatar_path ?? null);
  const [priority, setPriority] = useState(consultant?.priority ?? 'Medium');
  const [languages, setLanguages] = useState<LanguageFormValues[]>(
    consultant?.languages?.map((l) => ({ language: l.language, level: l.level as LanguageFormValues['level'] })) ?? [],
  );

  function addLanguage() {
    setLanguages((prev) => [...prev, { language: '', level: 'Basis' }]);
  }

  function removeLanguage(index: number) {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLanguage(index: number, field: keyof LanguageFormValues, value: string) {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const rolesRaw = (formData.get('roles') as string) || '';
    const techsRaw = (formData.get('technologies') as string) || '';

    const values: BenchConsultantFormValues = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      city: (formData.get('city') as string) || undefined,
      priority: priority as 'High' | 'Medium' | 'Low',
      available_date: (formData.get('available_date') as string) || null,
      min_hourly_rate: formData.get('min_hourly_rate') ? Number(formData.get('min_hourly_rate')) : null,
      max_hourly_rate: formData.get('max_hourly_rate') ? Number(formData.get('max_hourly_rate')) : null,
      roles: rolesRaw ? rolesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      technologies: techsRaw ? techsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      description: (formData.get('description') as string) || undefined,
      cv_pdf_url: cvUrl || null,
    };

    const parsed = benchConsultantFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      return null;
    }

    const validLanguages = languages.filter((l) => l.language.trim().length > 0);

    const result = isEdit
      ? await updateConsultant(consultant!.id, parsed.data, validLanguages)
      : await createBenchConsultant(parsed.data);

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return null;
    }

    toast.success(isEdit ? 'Consultant bijgewerkt' : 'Consultant aangemaakt');
    onClose();
    return null;
  }, null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Consultant bewerken' : 'Nieuwe consultant'}
      size="wide"
    >
      <form action={formAction} className="space-y-4">
        {/* Avatar — only for edit (need ID for storage path) */}
        {isEdit && (
          <div className="flex items-center gap-3">
            <AvatarUpload
              currentPath={avatarPath}
              fallback={`${consultant.first_name[0]}${consultant.last_name[0]}`}
              storagePath={`consultants/${consultant.id}`}
              onUploaded={setAvatarPath}
              size="lg"
              round
            />
            <div className="text-sm text-muted-foreground">Klik om avatar te wijzigen</div>
          </div>
        )}

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Voornaam *</Label>
            <Input id="first_name" name="first_name" defaultValue={consultant?.first_name ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Achternaam *</Label>
            <Input id="last_name" name="last_name" defaultValue={consultant?.last_name ?? ''} required />
          </div>
        </div>

        {/* City, Priority, Available date */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Stad</Label>
            <Input id="city" name="city" defaultValue={consultant?.city ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioriteit</Label>
            <Select value={priority} onValueChange={(v) => { if (v) setPriority(v as 'High' | 'Medium' | 'Low'); }}>
              <SelectTrigger>
                {priority || 'Selecteer...'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="available_date">Beschikbaar vanaf</Label>
            <DatePicker name="available_date" value={consultant?.available_date ?? ''} />
          </div>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min_hourly_rate">Min uurtarief (EUR)</Label>
            <Input id="min_hourly_rate" name="min_hourly_rate" type="number" defaultValue={consultant?.min_hourly_rate ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_hourly_rate">Max uurtarief (EUR)</Label>
            <Input id="max_hourly_rate" name="max_hourly_rate" type="number" defaultValue={consultant?.max_hourly_rate ?? ''} />
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-2">
          <Label htmlFor="roles">Rollen (komma-gescheiden)</Label>
          <Input id="roles" name="roles" defaultValue={consultant?.roles?.join(', ') ?? ''} placeholder="Dev Senior, Tech Lead" />
        </div>

        {/* Technologies */}
        <div className="space-y-2">
          <Label htmlFor="technologies">Technologieen (komma-gescheiden)</Label>
          <Input id="technologies" name="technologies" defaultValue={consultant?.technologies?.join(', ') ?? ''} placeholder="PHP, React, Docker" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Beschrijving</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={consultant?.description ?? ''} />
        </div>

        {/* CV Upload */}
        <div className="space-y-1.5">
          <Label>CV</Label>
          <PdfUploadField
            value={cvUrl}
            onChange={setCvUrl}
            bucket="documents"
            folder={isEdit ? `consultants/${consultant!.id}` : 'consultants'}
          />
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
                <SelectTrigger className="w-36">
                  {lang.level || 'Selecteer...'}
                </SelectTrigger>
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

        <SubmitButton icon={<Save />} className="w-full">
          {isEdit ? 'Bijwerken' : 'Aanmaken'}
        </SubmitButton>
      </form>
    </Modal>
  );
}
