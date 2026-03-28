'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Save, Trash2, Network, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/client';
import { createDeal } from '../actions/create-deal';
import { updateDeal } from '../actions/update-deal';
import { deleteDeal } from '../actions/delete-deal';
import { reopenDeal } from '../actions/reopen-deal';
import type { DealWithRelations } from '../types';

type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: { id: string; name: string; sort_order: number; is_closed: boolean; probability: number }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  accountId?: string;
  pipelines: Pipeline[];
  owners: { id: string; name: string }[];
  deal?: DealWithRelations;
  initialStageId?: string;
};

const LEAD_SOURCES = ['E-mail', 'Webformulier', 'Partner', 'Campagne', 'Social Media', 'Telefonisch', 'Evenement', 'Referral', 'Cold outreach', 'Andere'];

const DEAL_TAGS = ['Adobe Commerce', 'Marello', 'Magento', 'OroCommerce', 'Sulu CMS', 'Custom Dev', 'Pimcore', 'PIM', 'ERP Integratie', 'Analytics', 'SEO/SEA', 'UX / Design', 'Support', 'Training', 'Andere'];

export function DealEditModal({ open, onClose, accountId: propAccountId, pipelines, owners, deal, initialStageId }: Props) {
  const isEdit = !!deal;
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // --- Form state ---
  const [title, setTitle] = useState(deal?.title ?? '');
  const [selectedAccountId, setSelectedAccountId] = useState(deal?.account_id ?? propAccountId ?? '');
  const [pipelineId, setPipelineId] = useState(deal?.pipeline_id ?? pipelines[0]?.id ?? '');
  const [stageId, setStageId] = useState(() => {
    if (initialStageId) return initialStageId;
    if (deal?.stage_id) return deal.stage_id;
    const first = pipelines[0]?.stages.filter((s) => !s.is_closed).sort((a, b) => a.sort_order - b.sort_order)[0];
    return first?.id ?? '';
  });
  const [amount, setAmount] = useState(deal?.amount != null ? String(Number(deal.amount)) : '');
  const [probability, setProbability] = useState(() => {
    if (deal?.probability != null) return String(deal.probability);
    if (initialStageId) {
      const stage = pipelines.flatMap((p) => p.stages).find((s) => s.id === initialStageId);
      return stage ? String(stage.probability) : '';
    }
    const first = pipelines[0]?.stages.filter((s) => !s.is_closed).sort((a, b) => a.sort_order - b.sort_order)[0];
    return first ? String(first.probability) : '';
  });
  const [closeDate, setCloseDate] = useState(deal?.close_date ?? '');
  const [ownerId, setOwnerId] = useState(deal?.owner_id ?? '');
  const [contactId, setContactId] = useState(deal?.contact_id ?? '');
  const [origin, setOrigin] = useState<string>(deal?.origin ?? 'rechtstreeks');
  const [forecastCategory, setForecastCategory] = useState(deal?.forecast_category ?? '');
  const [description, setDescription] = useState(deal?.description ?? '');
  const [leadSource, setLeadSource] = useState(deal?.lead_source ?? '');
  const [cronosCC, setCronosCC] = useState(deal?.cronos_cc ?? '');
  const [cronosContact, setCronosContact] = useState(deal?.cronos_contact ?? '');
  const [cronosEmail, setCronosEmail] = useState(deal?.cronos_email ?? '');
  const [consultantId, setConsultantId] = useState(deal?.consultant_id ?? '');
  const [consultantRole, setConsultantRole] = useState(deal?.consultant_role ?? '');
  const [tags, setTags] = useState<string[]>(deal?.tags ?? []);
  const [tariefGewenst, setTariefGewenst] = useState(deal?.tarief_gewenst != null ? String(Number(deal.tarief_gewenst)) : '');
  const [tariefAangeboden, setTariefAangeboden] = useState(deal?.tarief_aangeboden != null ? String(Number(deal.tarief_aangeboden)) : '');

  // --- Derived ---
  const activePipeline = pipelines.find((p) => p.id === pipelineId);
  const isConsultancy = activePipeline?.type === 'consultancy';
  const sortedStages = (activePipeline?.stages ?? [])
    .filter((s) => !s.is_closed)
    .sort((a, b) => a.sort_order - b.sort_order);

  // --- Account search (when no propAccountId) ---
  const [accountSearch, setAccountSearch] = useState('');
  const [accountResults, setAccountResults] = useState<{ id: string; name: string }[]>([]);
  const [accountName, setAccountName] = useState(deal?.account?.name ?? '');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountSearchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch account name when propAccountId is set
  useEffect(() => {
    if (!propAccountId || accountName) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('accounts')
      .select('name')
      .eq('id', propAccountId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setAccountName(data.name);
      });
    return () => { cancelled = true; };
  }, [propAccountId, accountName]);

  // Debounced account search
  const handleAccountSearch = useCallback((query: string) => {
    setAccountSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setAccountResults([]);
      setShowAccountDropdown(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      const supabase = createBrowserClient();
      supabase
        .from('accounts')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(8)
        .then(({ data }) => {
          setAccountResults(data ?? []);
          setShowAccountDropdown((data ?? []).length > 0);
        });
    }, 300);
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountSearchRef.current && !accountSearchRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Contacts (filtered by selected account) ---
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (!selectedAccountId) {
      setContacts([]);
      return;
    }
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('account_id', selectedAccountId)
      .order('last_name')
      .then(({ data }) => {
        if (cancelled) return;
        setContacts((data ?? []).map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })));
      });
    return () => { cancelled = true; };
  }, [selectedAccountId]);

  // --- Bench consultants (consultancy pipeline only) ---
  const [benchConsultants, setBenchConsultants] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (!isConsultancy) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('consultants')
      .select('id, first_name, last_name, role, city')
      .eq('status', 'bench')
      .eq('is_archived', false)
      .order('last_name')
      .then(({ data }) => {
        if (cancelled) return;
        setBenchConsultants((data ?? []).map((c) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}${c.role ? ` · ${c.role}` : ''}${c.city ? ` · ${c.city}` : ''}`,
        })));
      });
    return () => { cancelled = true; };
  }, [isConsultancy]);

  // --- Pipeline / Stage handlers ---
  function handlePipelineChange(id: string | null) {
    const pid = id ?? '';
    setPipelineId(pid);
    const p = pipelines.find((pp) => pp.id === pid);
    const first = p?.stages.filter((s) => !s.is_closed).sort((a, b) => a.sort_order - b.sort_order)[0];
    setStageId(first?.id ?? '');
    setProbability(first ? String(first.probability) : '');
  }

  function handleStageChange(id: string | null) {
    const sid = id ?? '';
    setStageId(sid);
    const stage = activePipeline?.stages.find((s) => s.id === sid);
    if (stage) setProbability(String(stage.probability));
  }

  // --- Tag toggle ---
  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  // --- Reopen ---
  async function handleReopen() {
    if (!deal) return;
    const result = await reopenDeal(deal.id);
    if (result.success) {
      toast.success('Deal heropend');
      onClose();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  }

  // --- Delete ---
  async function handleDelete() {
    if (!deal) return;
    const result = await deleteDeal(deal.id);
    if (result.success) {
      toast.success('Deal verwijderd');
      onClose();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  }

  // --- Save ---
  async function handleSave() {
    if (!title || !pipelineId || !stageId) {
      toast.error('Vul de verplichte velden in');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Selecteer een account');
      return;
    }
    setSaving(true);

    const values = {
      title,
      account_id: selectedAccountId,
      pipeline_id: pipelineId,
      stage_id: stageId,
      amount: amount ? Number(amount) : undefined,
      probability: probability ? Number(probability) : undefined,
      owner_id: ownerId || undefined,
      contact_id: contactId || undefined,
      origin: (origin === 'rechtstreeks' || origin === 'cronos') ? origin as 'rechtstreeks' | 'cronos' : undefined,
      forecast_category: (['Commit', 'Best Case', 'Pipeline', 'Omit'].includes(forecastCategory) ? forecastCategory : undefined) as 'Commit' | 'Best Case' | 'Pipeline' | 'Omit' | undefined,
      description: description || undefined,
      close_date: closeDate || undefined,
      lead_source: leadSource || undefined,
      cronos_cc: origin === 'cronos' ? cronosCC || undefined : undefined,
      cronos_contact: origin === 'cronos' ? cronosContact || undefined : undefined,
      cronos_email: origin === 'cronos' ? cronosEmail || undefined : undefined,
      consultant_id: consultantId || undefined,
      consultant_role: consultantRole || undefined,
      tags: tags.length > 0 ? tags : undefined,
      tarief_gewenst: tariefGewenst ? Number(tariefGewenst) : undefined,
      tarief_aangeboden: tariefAangeboden ? Number(tariefAangeboden) : undefined,
    };

    const result = isEdit ? await updateDeal(deal!.id, values) : await createDeal(values);
    setSaving(false);

    if (result.success) {
      toast.success(isEdit ? 'Deal bijgewerkt' : 'Deal aangemaakt');
      onClose();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  }

  // --- Closed deal banner ---
  const isClosed = !!deal?.closed_type;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Deal bewerken' : 'Nieuwe deal'} size="extra-wide">
      {/* Closed deal banner */}
      {isClosed && (
        <div
          className={cn(
            'mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3',
            deal.closed_type === 'won' && 'bg-green-50 border border-green-200 text-green-800',
            deal.closed_type === 'lost' && 'bg-red-50 border border-red-200 text-red-800',
            deal.closed_type === 'longterm' && 'bg-amber-50 border border-amber-200 text-amber-800',
          )}
        >
          <span>
            {deal.closed_type === 'won' && '✓ Gewonnen'}
            {deal.closed_type === 'lost' && '✗ Verloren'}
            {deal.closed_type === 'longterm' && '⏸ Longterm / On hold'}
            {deal.closed_reason && ` — ${deal.closed_reason}`}
          </span>
          <button
            type="button"
            onClick={handleReopen}
            className="flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100 whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" />
            Heropen
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Titel */}
          <div className="space-y-1.5">
            <Label>Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal naam" />
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <Label>Account *</Label>
            {propAccountId ? (
              <Input value={accountName} disabled />
            ) : (
              <div className="relative" ref={accountSearchRef}>
                <Input
                  value={selectedAccountId ? accountName : accountSearch}
                  onChange={(e) => {
                    if (selectedAccountId) {
                      setSelectedAccountId('');
                      setAccountName('');
                      setContactId('');
                    }
                    handleAccountSearch(e.target.value);
                  }}
                  placeholder="Zoek account..."
                  onFocus={() => {
                    if (accountResults.length > 0) setShowAccountDropdown(true);
                  }}
                />
                {selectedAccountId && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => {
                      setSelectedAccountId('');
                      setAccountName('');
                      setAccountSearch('');
                      setContactId('');
                    }}
                  >
                    ✕
                  </button>
                )}
                {showAccountDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md">
                    {accountResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setSelectedAccountId(a.id);
                          setAccountName(a.name);
                          setAccountSearch('');
                          setShowAccountDropdown(false);
                        }}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="space-y-1.5">
            <Label>Pipeline *</Label>
            <Select value={pipelineId} onValueChange={handlePipelineChange}>
              <SelectTrigger>
                {activePipeline?.name ?? 'Selecteer...'}
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <Label>Stage *</Label>
            <Select value={stageId} onValueChange={handleStageChange}>
              <SelectTrigger>
                {sortedStages.find((s) => s.id === stageId)?.name ?? 'Selecteer...'}
              </SelectTrigger>
              <SelectContent>
                {sortedStages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount fields — conditional on pipeline type */}
          {isConsultancy ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gewenst tarief (€/u)</Label>
                <Input
                  type="number"
                  min="0"
                  value={tariefGewenst}
                  onChange={(e) => setTariefGewenst(e.target.value)}
                  placeholder="bv. 95"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aangeboden tarief (€/u)</Label>
                <Input
                  type="number"
                  min="0"
                  value={tariefAangeboden}
                  onChange={(e) => setTariefAangeboden(e.target.value)}
                  placeholder="bv. 110"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Waarde (€)</Label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          {/* Close date + Probability side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sluitdatum</Label>
              <DatePicker value={closeDate} onChange={setCloseDate} />
            </div>
            <div className="space-y-1.5">
              <Label>Kans %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
              />
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <Label>Eigenaar</Label>
            <Select value={ownerId} onValueChange={(v) => setOwnerId(v ?? '')}>
              <SelectTrigger>
                {owners.find((o) => o.id === ownerId)?.name ?? '— geen —'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— geen —</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Consultant fields (consultancy pipeline only) */}
          {isConsultancy && (
            <>
              <div className="space-y-1.5">
                <Label>Bench consultant</Label>
                <Select value={consultantId} onValueChange={(v) => setConsultantId(v ?? '')}>
                  <SelectTrigger>
                    {benchConsultants.find((c) => c.id === consultantId)?.name ?? '— Selecteer consultant —'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Selecteer consultant —</SelectItem>
                    {benchConsultants.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rol bij klant</Label>
                <Input
                  value={consultantRole}
                  onChange={(e) => setConsultantRole(e.target.value)}
                  placeholder="bv. Dev Senior, Business Analist..."
                />
              </div>
            </>
          )}

          {/* Contact */}
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={(v) => setContactId(v ?? '')}>
              <SelectTrigger>
                {contacts.find((c) => c.id === contactId)?.name ?? '— Selecteer contact —'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Selecteer contact —</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lead bron */}
          <div className="space-y-1.5">
            <Label>Lead bron</Label>
            <Select value={leadSource} onValueChange={(v) => setLeadSource(v ?? '')}>
              <SelectTrigger>
                {leadSource || '— Selecteer bron —'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Selecteer bron —</SelectItem>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Herkomst toggle buttons */}
          <div className="space-y-1.5">
            <Label>Herkomst</Label>
            <div className="flex gap-2">
              {([['rechtstreeks', 'Rechtstreeks'], ['cronos', 'Via Cronos']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrigin(value)}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                    origin === value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cronos details (conditional) */}
          {origin === 'cronos' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5" />
                Cronos details
              </p>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Competence Center</label>
                <Input
                  value={cronosCC}
                  onChange={(e) => setCronosCC(e.target.value)}
                  placeholder="bv. Induxx, Humix, Osudio..."
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Contactpersoon Cronos</label>
                <Input
                  value={cronosContact}
                  onChange={(e) => setCronosContact(e.target.value)}
                  placeholder="Naam contactpersoon"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">E-mail Cronos</label>
                <Input
                  type="email"
                  value={cronosEmail}
                  onChange={(e) => setCronosEmail(e.target.value)}
                  placeholder="contact@cronos.be"
                  className="bg-white"
                />
              </div>
            </div>
          )}

          {/* Beschrijving */}
          <div className="space-y-1.5">
            <Label>Beschrijving</Label>
            <Textarea
              rows={origin === 'cronos' ? 2 : 4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Omschrijving van de deal..."
            />
          </div>

          {/* Tags / Services (non-consultancy only) */}
          {!isConsultancy && (
            <div className="space-y-1.5">
              <Label>Tags / Services</Label>
              <div className="flex flex-wrap gap-1.5">
                {DEAL_TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-full border transition-all',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary',
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <div>
          {isEdit && (
            <ConfirmDialog
              title="Deal verwijderen"
              description="Weet je zeker dat je deze deal wilt verwijderen? Dit kan niet ongedaan worden."
              onConfirm={handleDelete}
              variant="destructive"
              open={confirmDeleteOpen}
              onOpenChange={setConfirmDeleteOpen}
            />
          )}
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 />
              Verwijderen
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving || !title}>
            <Save />
            {saving ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
