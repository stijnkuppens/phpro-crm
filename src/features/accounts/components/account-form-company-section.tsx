'use client';

import { FormSectionHeading } from '@/components/admin/form-section-heading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AccountFormValues } from '@/features/accounts/types';
import { formatNumber } from '@/lib/format';

const COUNTRY_OPTIONS = [
  { value: 'BE', label: 'Belgie' },
  { value: 'NL', label: 'Nederland' },
  { value: 'FR', label: 'Frankrijk' },
  { value: 'DE', label: 'Duitsland' },
];

type Props = {
  defaultValues?: Partial<AccountFormValues>;
};

export function AccountFormCompanySection({ defaultValues }: Props) {
  return (
    <div className="space-y-4">
      <FormSectionHeading>Bedrijfsinformatie</FormSectionHeading>

      <div className="space-y-1.5">
        <Label htmlFor="name">Naam *</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name ?? ''} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="domain">Domein</Label>
        <Input
          id="domain"
          name="domain"
          defaultValue={defaultValues?.domain ?? ''}
          placeholder="bv. bedrijf.be"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? 'Prospect'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Klant">Klant</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
              <SelectItem value="Partner">Partner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? 'Actief'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Actief">Actief</SelectItem>
              <SelectItem value="Inactief">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="industry">Sector</Label>
        <Input
          id="industry"
          name="industry"
          defaultValue={defaultValues?.industry ?? ''}
          placeholder="bv. Technology"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="size">Grootte</Label>
          <Select name="size" defaultValue={defaultValues?.size ?? ''}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="51-200">51-200</SelectItem>
              <SelectItem value="201-1000">201-1000</SelectItem>
              <SelectItem value="1000+">1000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="revenue_display">Omzet</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              €
            </span>
            <Input
              id="revenue_display"
              type="text"
              inputMode="numeric"
              defaultValue={
                defaultValues?.revenue ? formatNumber(Number(defaultValues.revenue)) : ''
              }
              placeholder="bv. 1.000.000"
              className="pl-7"
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                const hidden =
                  e.target.form?.querySelector<HTMLInputElement>('input[name="revenue"]');
                if (hidden) hidden.value = raw;
                if (raw) {
                  e.target.value = formatNumber(Number(raw));
                }
              }}
            />
            <input type="hidden" name="revenue" defaultValue={defaultValues?.revenue ?? ''} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefoon</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={defaultValues?.phone ?? ''}
          placeholder="+32 ..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          defaultValue={defaultValues?.website ?? ''}
          placeholder="www.bedrijf.be"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Adres</Label>
        <Input
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ''}
          placeholder="Straat 1, 1000 Stad"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="country">Land</Label>
          <Select name="country" defaultValue={defaultValues?.country ?? ''}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer..." />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vat_number">BTW-nummer</Label>
          <Input
            id="vat_number"
            name="vat_number"
            defaultValue={defaultValues?.vat_number ?? ''}
            placeholder="BE0123.456.789"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about">Over dit bedrijf</Label>
        <Textarea
          id="about"
          name="about"
          rows={3}
          defaultValue={defaultValues?.about ?? ''}
          placeholder="Korte omschrijving..."
        />
      </div>
    </div>
  );
}
