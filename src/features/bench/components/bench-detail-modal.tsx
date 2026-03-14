'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BenchForm } from './bench-form';
import type { BenchConsultantWithLanguages } from '../types';

type Props = {
  consultant: BenchConsultantWithLanguages;
  open: boolean;
  onClose: () => void;
};

export function BenchDetailModal({ consultant, open, onClose }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Modal open={open} onClose={onClose} title="Bench consultant bewerken" size="wide">
        <BenchForm
          defaultValues={{
            id: consultant.id,
            first_name: consultant.first_name,
            last_name: consultant.last_name,
            city: consultant.city ?? undefined,
            priority: consultant.priority as 'High' | 'Medium' | 'Low',
            available_date: consultant.available_date,
            min_hourly_rate: consultant.min_hourly_rate,
            max_hourly_rate: consultant.max_hourly_rate,
            roles: consultant.roles ?? [],
            technologies: consultant.technologies ?? [],
            description: consultant.description ?? undefined,
            cv_pdf_url: consultant.cv_pdf_url,
          }}
          defaultLanguages={consultant.languages.map((l) => ({ language: l.language, level: l.level as 'Basis' | 'Gevorderd' | 'Vloeiend' | 'Moedertaal' }))}
          onSuccess={() => { setEditing(false); onClose(); }}
        />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`${consultant.first_name} ${consultant.last_name}`} size="wide">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Stad:</span> {consultant.city ?? '-'}
          </div>
          <div>
            <span className="text-muted-foreground">Prioriteit:</span>{' '}
            <Badge variant="secondary">{consultant.priority}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Uurtarief:</span>{' '}
            {consultant.min_hourly_rate && consultant.max_hourly_rate
              ? `€${consultant.min_hourly_rate} - €${consultant.max_hourly_rate}`
              : '-'}
          </div>
          <div>
            <span className="text-muted-foreground">Beschikbaar:</span>{' '}
            {consultant.available_date
              ? new Date(consultant.available_date).toLocaleDateString('nl-BE')
              : '-'}
          </div>
        </div>
        {consultant.roles && consultant.roles.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Rollen:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {consultant.roles.map((r) => (
                <Badge key={r} variant="secondary">{r}</Badge>
              ))}
            </div>
          </div>
        )}
        {consultant.technologies && consultant.technologies.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Technologieën:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {consultant.technologies.map((t) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
          </div>
        )}
        {consultant.languages && consultant.languages.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Talen:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {consultant.languages.map((l) => (
                <Badge key={l.id} variant="outline">{l.language} ({l.level})</Badge>
              ))}
            </div>
          </div>
        )}
        {consultant.description && (
          <div>
            <span className="text-sm text-muted-foreground">Beschrijving:</span>
            <p className="text-sm mt-1">{consultant.description}</p>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={() => setEditing(true)}>Bewerken</Button>
        </div>
      </div>
    </Modal>
  );
}
