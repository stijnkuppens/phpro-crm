'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { ContactWithDetails } from '../types';

type Props = {
  contact: ContactWithDetails;
};

export function ContactDetail({ contact }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
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
            <p>{contact.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Telefoon</p>
            <p>{contact.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Functie</p>
            <p>{contact.title || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            {contact.role && <Badge variant="outline">{contact.role}</Badge>}
            {contact.is_steerco && <Badge variant="secondary">Steerco</Badge>}
            {contact.is_pinned && <Badge variant="default">Gepind</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {contact.personal_info && (
            <>
              {contact.personal_info.birthday && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verjaardag</p>
                  <p>{new Date(contact.personal_info.birthday).toLocaleDateString('nl-BE')}</p>
                </div>
              )}
              {contact.personal_info.hobbies && contact.personal_info.hobbies.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hobby&apos;s</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.personal_info.hobbies.map((h) => (
                      <Badge key={h} variant="outline">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {contact.personal_info.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notities</p>
                  <p className="text-sm">{contact.personal_info.notes}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
