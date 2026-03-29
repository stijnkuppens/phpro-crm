'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar } from '@/components/admin/avatar';
import type { AccountFormValues } from '@/features/accounts/types';

type Props = {
  defaultValues?: Partial<AccountFormValues>;
  internalPeople?: { id: string; name: string; avatar_url?: string | null }[];
  teams?: { id: string; name: string }[];
};

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

export function AccountFormPeopleSection({ defaultValues, internalPeople, teams }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="managing_partner">Managing Partner</Label>
        <Select name="managing_partner" defaultValue={defaultValues?.managing_partner ?? ''}>
          <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Geen</SelectItem>
            {internalPeople?.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                <Avatar path={p.avatar_url} fallback={getInitials(p.name)} size="xs" />
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="account_director">Account Director</Label>
        <Select name="account_director" defaultValue={defaultValues?.account_director ?? ''}>
          <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Geen</SelectItem>
            {internalPeople?.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                <Avatar path={p.avatar_url} fallback={getInitials(p.name)} size="xs" />
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project_manager">Project Manager</Label>
        <Select name="project_manager" defaultValue={defaultValues?.project_manager ?? ''}>
          <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Geen</SelectItem>
            {internalPeople?.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                <Avatar path={p.avatar_url} fallback={getInitials(p.name)} size="xs" />
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="team">Team</Label>
        <Select name="team" defaultValue={defaultValues?.team ?? ''}>
          <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Geen</SelectItem>
            {teams?.map((t) => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
