'use client';

import { CalendarDays, Eye, Gift, Mail, Pencil, Phone, ShieldCheck, Star, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { InfoRow } from '@/components/admin/info-row';
import { Modal } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createBrowserClient } from '@/lib/supabase/client';
import { updateContactAvatar } from '../actions/update-contact-avatar';
import type { ContactWithDetails } from '../types';

type Props = {
  contactId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
};

export function ContactViewModal({ contactId, onClose, onEdit }: Props) {
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset contact when contactId changes (render-phase setState to avoid lint error)
  const [prevContactId, setPrevContactId] = useState<string | null>(contactId);
  if (prevContactId !== contactId) {
    setPrevContactId(contactId);
    setContact(null);
    if (contactId) setLoading(true);
  }

  // Client-side fetch is intentional: the parent list only has basic Contact data,
  // but viewing requires ContactWithDetails (including personal_info and account).
  // Pre-fetching personal_info for all contacts in the list would be wasteful.
  useEffect(() => {
    if (!contactId) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('contacts')
      .select('*, personal_info:contact_personal_info(*), account:accounts!account_id(id, name)')
      .eq('id', contactId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setContact(data as ContactWithDetails | null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const pi = contact?.personal_info;
  const initials = contact ? `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase() : '';

  return (
    <Modal
      open={!!contactId}
      onClose={onClose}
      title=""
      size="wide"
      footer={
        contact ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Sluiten
            </Button>
            <Button onClick={() => onEdit(contact.id)}>
              <Pencil /> Bewerken
            </Button>
          </>
        ) : undefined
      }
    >
      {loading || !contact ? (
        <div className="py-12 text-center text-muted-foreground">Laden...</div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4">
            <AvatarUpload
              currentPath={contact.avatar_url}
              fallback={initials}
              storagePath={`contacts/${contact.id}`}
              onUploaded={async (path) => {
                await updateContactAvatar(contact.id, path);
                setContact((prev) => (prev ? { ...prev, avatar_url: path } : prev));
              }}
            />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                {contact.first_name} {contact.last_name}
              </h2>
              {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {contact.role && (
                  <Badge className="bg-primary/15 text-primary-action border-0">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    {contact.role}
                  </Badge>
                )}
                {contact.is_steerco && (
                  <Badge className="bg-primary/15 text-primary-action border-0">
                    <Star className="mr-1 h-3 w-3" />
                    Steerco
                  </Badge>
                )}
                {contact.is_pinned && (
                  <Badge className="bg-primary/15 text-primary-action border-0">
                    <Eye className="mr-1 h-3 w-3" />
                    Overview
                  </Badge>
                )}
                {contact.account && (
                  <Link
                    href={`/admin/accounts/${contact.account.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {contact.account.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {contact.email && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-4 w-4" /> {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" /> {contact.phone}
              </span>
            )}
          </div>

          {/* Relationship badges */}
          {(pi?.invite_dinner || pi?.invite_event || pi?.invite_gift) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Relatiebeheer:</span>
              {pi?.invite_dinner && (
                <Badge className="bg-primary/15 text-primary-action border-0">
                  <UtensilsCrossed className="mr-1 h-3 w-3" />
                  Diner
                </Badge>
              )}
              {pi?.invite_event && (
                <Badge className="bg-primary/15 text-primary-action border-0">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  Event
                </Badge>
              )}
              {pi?.invite_gift && (
                <Badge className="bg-primary/15 text-primary-action border-0">
                  <Gift className="mr-1 h-3 w-3" />
                  Gift
                </Badge>
              )}
            </div>
          )}

          <Separator />

          {/* Personal info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Persoonlijke info</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <InfoRow label="Hobby's">
                {pi?.hobbies && pi.hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {pi.hobbies.map((h) => (
                      <Badge key={h} variant="outline">
                        {h}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Burgerlijke staat">{pi?.marital_status || '—'}</InfoRow>
              <InfoRow label="Verjaardag">{pi?.birthday || '—'}</InfoRow>
              <InfoRow label="Kinderen">
                {pi?.has_children ? `Ja${pi.children_count ? ` (${pi.children_count})` : ''}` : 'Nee'}
              </InfoRow>
              {pi?.children_names && <InfoRow label="Namen kinderen">{pi.children_names}</InfoRow>}
              <InfoRow label="Partner">{pi?.partner_name || '—'}</InfoRow>
              <InfoRow label="Beroep partner">{pi?.partner_profession || '—'}</InfoRow>
            </div>
            {pi?.notes && (
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground">Notities</p>
                <p className="mt-0.5 text-sm">{pi.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
