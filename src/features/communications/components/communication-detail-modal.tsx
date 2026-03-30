'use client';

import { Briefcase, Calendar, Clock, Mail, SquarePen, User } from 'lucide-react';
import { Modal } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { CommunicationWithDetails } from '../types';
import { COMMUNICATION_TYPE_CONFIG } from '../types';

type Props = {
  communication: CommunicationWithDetails;
  onClose: () => void;
  onEdit: () => void;
};

function extractContentText(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null && 'text' in content) {
    return (content as { text: string }).text;
  }
  return '';
}

export function CommunicationDetailModal({ communication: comm, onClose, onEdit }: Props) {
  const config = COMMUNICATION_TYPE_CONFIG[comm.type] ?? COMMUNICATION_TYPE_CONFIG.note;
  const Icon = config.icon;
  const contentText = extractContentText(comm.content);

  return (
    <Modal open onClose={onClose} title={comm.subject} size="wide">
      <div className="space-y-5">
        {/* Type + date header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-8 w-8 rounded-md ${config.bg}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <Badge variant="secondary">{config.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(comm.date).toLocaleDateString('nl-BE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <Separator />

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {comm.to && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Aan</div>
                <div>{comm.to}</div>
              </div>
            </div>
          )}
          {comm.contact && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Contact</div>
                <div>
                  {comm.contact.first_name} {comm.contact.last_name}
                </div>
              </div>
            </div>
          )}
          {comm.deal && (
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Deal</div>
                <div>{comm.deal.title}</div>
              </div>
            </div>
          )}
          {comm.owner?.full_name && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Eigenaar</div>
                <div>{comm.owner.full_name}</div>
              </div>
            </div>
          )}
          {comm.duration_minutes != null && comm.duration_minutes > 0 && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Duur</div>
                <div>{comm.duration_minutes} min</div>
              </div>
            </div>
          )}
        </div>

        {/* Content / notes */}
        {contentText && (
          <>
            <Separator />
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Inhoud</div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">{contentText}</div>
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Sluiten
          </Button>
          <Button onClick={onEdit}>
            <SquarePen />
            Bewerken
          </Button>
        </div>
      </div>
    </Modal>
  );
}
