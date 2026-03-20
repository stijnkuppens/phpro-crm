'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import type { ContactWithDetails, PersonalInfoFormValues } from '../types';
import { updatePersonalInfo } from '../actions/update-personal-info';

type Props = {
  contact: ContactWithDetails;
};

function getDefaults(contact: ContactWithDetails): PersonalInfoFormValues {
  const pi = contact.personal_info;
  return {
    hobbies: pi?.hobbies ?? [],
    marital_status: pi?.marital_status ?? '',
    has_children: pi?.has_children ?? false,
    children_count: pi?.children_count ?? undefined,
    children_names: pi?.children_names ?? '',
    birthday: pi?.birthday ?? '',
    partner_name: pi?.partner_name ?? '',
    partner_profession: pi?.partner_profession ?? '',
    notes: pi?.notes ?? '',
    invite_dinner: pi?.invite_dinner ?? false,
    invite_event: pi?.invite_event ?? false,
    invite_gift: pi?.invite_gift ?? false,
  };
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export function ContactDetail({ contact }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<PersonalInfoFormValues>(getDefaults(contact));
  const router = useRouter();

  const pi = contact.personal_info;

  function handleCancel() {
    setFormValues(getDefaults(contact));
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    const toSave: PersonalInfoFormValues = {
      ...formValues,
      hobbies: Array.isArray(formValues.hobbies) ? formValues.hobbies : [],
    };
    const result = await updatePersonalInfo(contact.id, toSave);
    setSaving(false);
    if (result.success) {
      toast.success('Persoonlijke info bijgewerkt');
      setEditing(false);
      router.refresh();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  }

  function updateField<K extends keyof PersonalInfoFormValues>(key: K, value: PersonalInfoFormValues[K]) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Naam</p>
            <p>{contact.first_name} {contact.last_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">E-mail</p>
            <p>{contact.email || '\u2014'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Telefoon</p>
            <p>{contact.phone || '\u2014'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Functie</p>
            <p>{contact.title || '\u2014'}</p>
          </div>
          <div className="flex items-center gap-2">
            {contact.role && <Badge variant="outline">{contact.role}</Badge>}
            {contact.is_steerco && <Badge variant="secondary">Steerco</Badge>}
            {contact.is_pinned && <Badge variant="default">Gepind</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Account card */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.account ? (
            <Link
              href={`/admin/accounts/${contact.account.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {contact.account.name}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">Geen account gekoppeld</p>
          )}
        </CardContent>
      </Card>

      {/* Personal Info card - full width */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Persoonlijke Info</CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Bewerken
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Verjaardag</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formValues.birthday ?? ''}
                    onChange={(e) => updateField('birthday', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Burgerlijke staat</Label>
                  <Input
                    id="marital_status"
                    value={formValues.marital_status ?? ''}
                    onChange={(e) => updateField('marital_status', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_name">Partner naam</Label>
                  <Input
                    id="partner_name"
                    value={formValues.partner_name ?? ''}
                    onChange={(e) => updateField('partner_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_profession">Partner beroep</Label>
                  <Input
                    id="partner_profession"
                    value={formValues.partner_profession ?? ''}
                    onChange={(e) => updateField('partner_profession', e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has_children"
                      checked={formValues.has_children ?? false}
                      onCheckedChange={(checked) => updateField('has_children', checked === true)}
                    />
                    <Label htmlFor="has_children">Kinderen</Label>
                  </div>
                  {formValues.has_children && (
                    <div className="space-y-1">
                      <Label htmlFor="children_count">Aantal</Label>
                      <Input
                        id="children_count"
                        type="number"
                        min={0}
                        className="w-20"
                        value={formValues.children_count ?? ''}
                        onChange={(e) => updateField('children_count', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children_names">Kindernamen</Label>
                  <Input
                    id="children_names"
                    value={formValues.children_names ?? ''}
                    onChange={(e) => updateField('children_names', e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hobbies">Hobby&apos;s (kommagescheiden)</Label>
                  <Input
                    id="hobbies"
                    value={formValues.hobbies?.join(', ') ?? ''}
                    onChange={(e) =>
                      updateField(
                        'hobbies',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      )
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={formValues.notes ?? ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="invite_dinner"
                    checked={formValues.invite_dinner ?? false}
                    onCheckedChange={(checked) => updateField('invite_dinner', checked === true)}
                  />
                  <Label htmlFor="invite_dinner">Uitnodigen diner</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="invite_event"
                    checked={formValues.invite_event ?? false}
                    onCheckedChange={(checked) => updateField('invite_event', checked === true)}
                  />
                  <Label htmlFor="invite_event">Uitnodigen event</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="invite_gift"
                    checked={formValues.invite_gift ?? false}
                    onCheckedChange={(checked) => updateField('invite_gift', checked === true)}
                  />
                  <Label htmlFor="invite_gift">Cadeau</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  Annuleren
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoField label="Verjaardag">
                  <p>{pi?.birthday ? new Date(pi.birthday).toLocaleDateString('nl-BE') : '\u2014'}</p>
                </InfoField>
                <InfoField label="Burgerlijke staat">
                  <p>{pi?.marital_status || '\u2014'}</p>
                </InfoField>
                <InfoField label="Partner naam">
                  <p>{pi?.partner_name || '\u2014'}</p>
                </InfoField>
                <InfoField label="Partner beroep">
                  <p>{pi?.partner_profession || '\u2014'}</p>
                </InfoField>
                <InfoField label="Kinderen">
                  <p>
                    {pi?.has_children
                      ? `Ja${pi.children_count ? ` (${pi.children_count})` : ''}`
                      : 'Nee'}
                  </p>
                </InfoField>
                <InfoField label="Kindernamen">
                  <p>{pi?.children_names || '\u2014'}</p>
                </InfoField>
                <InfoField label="Hobby's">
                  {pi?.hobbies && pi.hobbies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {pi.hobbies.map((h) => (
                        <Badge key={h} variant="outline">{h}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p>{'\u2014'}</p>
                  )}
                </InfoField>
              </div>
              <InfoField label="Notities">
                <p className="text-sm">{pi?.notes || '\u2014'}</p>
              </InfoField>
              <div className="flex gap-6 text-sm">
                <span>Diner: {pi?.invite_dinner ? 'Ja' : 'Nee'}</span>
                <span>Event: {pi?.invite_event ? 'Ja' : 'Nee'}</span>
                <span>Cadeau: {pi?.invite_gift ? 'Ja' : 'Nee'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
