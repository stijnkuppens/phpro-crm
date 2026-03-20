'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDeal } from '../actions/create-deal';

type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: { id: string; name: string; sort_order: number; is_closed: boolean }[];
};

type QuickDealModalProps = {
  open: boolean;
  onClose: () => void;
  pipelines: Pipeline[];
  prefill?: {
    bench_consultant_id: string;
    consultant_name: string;
    consultant_role?: string;
    min_hourly_rate?: number | null;
    max_hourly_rate?: number | null;
  };
  onSuccess?: () => void;
};

export function QuickDealModal({ open, onClose, pipelines, prefill, onSuccess }: QuickDealModalProps) {
  const rfpPipeline = pipelines.find(p => p.type === 'rfp');
  const consultancyPipeline = pipelines.find(p => p.type === 'consultancy');

  const [selectedType, setSelectedType] = useState<'rfp' | 'consultancy'>(prefill ? 'consultancy' : 'rfp');
  const [title, setTitle] = useState(prefill ? `Profiel: ${prefill.consultant_name}` : '');
  const [accountId, setAccountId] = useState('');
  const [origin, setOrigin] = useState<string>('');
  const [cronosCC, setCronosCC] = useState('');
  const [cronosContact, setCronosContact] = useState('');
  const [cronosEmail, setCronosEmail] = useState('');
  const [consultantRole, setConsultantRole] = useState(prefill?.consultant_role ?? '');
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const activePipeline = selectedType === 'rfp' ? rfpPipeline : consultancyPipeline;

  async function handleSave() {
    if (!activePipeline) return;
    setSaving(true);

    const firstStage = activePipeline.stages
      .filter(s => !s.is_closed)
      .sort((a, b) => a.sort_order - b.sort_order)[0];

    const result = await createDeal({
      title,
      account_id: accountId,
      pipeline_id: activePipeline.id,
      stage_id: firstStage?.id ?? '',
      amount: selectedType === 'rfp' ? amount : undefined,
      origin: (origin === 'rechtstreeks' || origin === 'cronos') ? origin : undefined,
      cronos_cc: origin === 'cronos' ? cronosCC : undefined,
      cronos_contact: origin === 'cronos' ? cronosContact : undefined,
      cronos_email: origin === 'cronos' ? cronosEmail : undefined,
      bench_consultant_id: prefill?.bench_consultant_id ?? undefined,
      consultant_role: consultantRole || undefined,
      description: description || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast.success('Deal aangemaakt');
      onClose();
      onSuccess?.();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Snelle deal aanmaken</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pipeline toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedType === 'rfp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('rfp')}
            >
              RFP
            </Button>
            <Button
              type="button"
              variant={selectedType === 'consultancy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('consultancy')}
            >
              Consultancy Profielen
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="qd-title">Titel *</Label>
            <Input
              id="qd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <Label htmlFor="qd-account">Account ID *</Label>
            <Input
              id="qd-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="UUID van het account"
            />
          </div>

          {/* Origin */}
          <div className="space-y-2">
            <Label htmlFor="qd-origin">Origine</Label>
            <Select value={origin} onValueChange={(v) => setOrigin(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rechtstreeks">Rechtstreeks</SelectItem>
                <SelectItem value="cronos">Via Cronos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cronos fields */}
          {origin === 'cronos' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qd-cronos-cc">Cronos CC</Label>
                <Input
                  id="qd-cronos-cc"
                  value={cronosCC}
                  onChange={(e) => setCronosCC(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qd-cronos-contact">Cronos contact</Label>
                <Input
                  id="qd-cronos-contact"
                  value={cronosContact}
                  onChange={(e) => setCronosContact(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="qd-cronos-email">Cronos e-mail</Label>
                <Input
                  id="qd-cronos-email"
                  type="email"
                  value={cronosEmail}
                  onChange={(e) => setCronosEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Consultancy-specific fields */}
          {selectedType === 'consultancy' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qd-role">Consultant rol</Label>
                <Input
                  id="qd-role"
                  value={consultantRole}
                  onChange={(e) => setConsultantRole(e.target.value)}
                />
              </div>
              {prefill?.min_hourly_rate != null && prefill?.max_hourly_rate != null && (
                <p className="text-sm text-muted-foreground">
                  Uurtarief: {prefill.min_hourly_rate} - {prefill.max_hourly_rate} EUR/u
                </p>
              )}
            </div>
          )}

          {/* RFP-specific fields */}
          {selectedType === 'rfp' && (
            <div className="space-y-2">
              <Label htmlFor="qd-amount">Bedrag</Label>
              <Input
                id="qd-amount"
                type="number"
                min="0"
                value={amount ?? ''}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="qd-description">Beschrijving</Label>
            <Textarea
              id="qd-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving || !title || !accountId}>
            {saving ? 'Bezig...' : 'Aanmaken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
