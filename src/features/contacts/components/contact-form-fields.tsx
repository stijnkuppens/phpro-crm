'use client';

import { Baby, CalendarDays, Gift, Pin, Star, UtensilsCrossed } from 'lucide-react';
import { TogglePill } from '@/components/admin/toggle-pill';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { fieldErrorClass } from '@/lib/form-errors';
import type { ContactFormValues, PersonalInfoFormValues } from '../types';

const ROLES = [
  'Decision Maker',
  'Influencer',
  'Champion',
  'Sponsor',
  'Steerco Lid',
  'Technisch',
  'Financieel',
  'Operationeel',
  'Contact',
] as const;

type Props = {
  defaultValues?: Partial<ContactFormValues>;
  defaultPersonalInfo?: Partial<PersonalInfoFormValues>;
  errors?: Record<string, boolean>;
};

export function ContactFormFields({ defaultValues, defaultPersonalInfo, errors }: Props) {
  return (
    <Tabs defaultValue="zakelijk" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="zakelijk">Zakelijk</TabsTrigger>
        <TabsTrigger value="persoonlijk">Persoonlijk</TabsTrigger>
      </TabsList>

      <TabsContent value="zakelijk" className="space-y-4 mt-4" keepMounted>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Voornaam *</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={defaultValues?.first_name ?? ''}
              required
              className={errors?.first_name ? fieldErrorClass : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Achternaam *</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={defaultValues?.last_name ?? ''}
              required
              className={errors?.last_name ? fieldErrorClass : ''}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Functietitel</Label>
          <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ''} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select name="role" defaultValue={defaultValues?.role ?? ''}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer rol" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <TogglePill
            name="is_steerco"
            label="Steerco"
            icon={Star}
            defaultActive={defaultValues?.is_steerco ?? false}
          />
          <TogglePill
            name="is_pinned"
            label="Toon in overview"
            icon={Pin}
            defaultActive={defaultValues?.is_pinned ?? false}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Relatiebeheer</Label>
          <div className="flex items-center gap-2">
            <TogglePill
              name="invite_dinner"
              label="Diner"
              icon={UtensilsCrossed}
              defaultActive={defaultPersonalInfo?.invite_dinner ?? false}
            />
            <TogglePill
              name="invite_event"
              label="Event"
              icon={CalendarDays}
              defaultActive={defaultPersonalInfo?.invite_event ?? false}
            />
            <TogglePill
              name="invite_gift"
              label="Gift"
              icon={Gift}
              defaultActive={defaultPersonalInfo?.invite_gift ?? false}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="persoonlijk" className="space-y-4 mt-4" keepMounted>
        <div className="space-y-2">
          <Label htmlFor="hobbies">Hobby&apos;s (kommagescheiden)</Label>
          <Input id="hobbies" name="hobbies" defaultValue={defaultPersonalInfo?.hobbies?.join(', ') ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marital_status">Burgerlijke staat</Label>
            <Input id="marital_status" name="marital_status" defaultValue={defaultPersonalInfo?.marital_status ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">Verjaardag</Label>
            <Input
              id="birthday"
              name="birthday"
              defaultValue={defaultPersonalInfo?.birthday ?? ''}
              placeholder="DD/MM"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <TogglePill
            name="has_children"
            label="Kinderen"
            icon={Baby}
            defaultActive={defaultPersonalInfo?.has_children ?? false}
          />
          <Input
            id="children_count"
            name="children_count"
            type="number"
            min={0}
            className="w-20"
            defaultValue={defaultPersonalInfo?.children_count ?? ''}
            placeholder="#"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="children_names">Namen kinderen</Label>
          <Input id="children_names" name="children_names" defaultValue={defaultPersonalInfo?.children_names ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partner_name">Naam partner</Label>
            <Input id="partner_name" name="partner_name" defaultValue={defaultPersonalInfo?.partner_name ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner_profession">Beroep partner</Label>
            <Input
              id="partner_profession"
              name="partner_profession"
              defaultValue={defaultPersonalInfo?.partner_profession ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Algemene info</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={defaultPersonalInfo?.notes ?? ''} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
