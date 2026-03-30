'use client';

import { Avatar } from '@/components/admin/avatar';
import { InfoRow } from '@/components/admin/info-row';
import { StatusBadge } from '@/components/admin/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/format';
import type { UserDetail as UserDetailType } from '../queries/get-user';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  customer_success: 'Customer Success',
  marketing: 'Marketing',
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  sales_manager: 'bg-blue-100 text-blue-700',
  sales_rep: 'bg-green-100 text-green-700',
  customer_success: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
};

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

type Props = {
  user: UserDetailType;
};

export function UserDetail({ user }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Profiel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-4 pb-2">
            <Avatar
              path={user.avatar_url || null}
              fallback={getInitials(user.full_name)}
              size="md"
              round
            />
            <div>
              <p className="font-medium text-base">{user.full_name || 'Naamloos'}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <InfoRow label="Rol">
            <StatusBadge colorMap={ROLE_STYLES} value={user.role}>
              {ROLE_LABELS[user.role] ?? user.role}
            </StatusBadge>
          </InfoRow>
          <InfoRow label="E-mail" value={user.email} />
        </CardContent>
      </Card>

      {/* Account details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Accountgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <InfoRow label="Lid sinds" value={formatDate(user.created_at)} />
          <InfoRow
            label="Laatste login"
            value={user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : 'Nooit'}
          />
          <InfoRow
            label="E-mail bevestigd"
            value={user.email_confirmed_at ? formatDate(user.email_confirmed_at) : 'Nee'}
          />
          <InfoRow
            label="Uitgenodigd op"
            value={user.invited_at ? formatDate(user.invited_at) : undefined}
          />
          <InfoRow label="Laatst bijgewerkt" value={formatDateTime(user.updated_at)} />
        </CardContent>
      </Card>
    </div>
  );
}
