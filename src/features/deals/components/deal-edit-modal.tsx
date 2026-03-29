'use client';

import { createContext, use, useReducer, useState, useEffect, useRef, useCallback } from 'react';
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
import type { DealWithRelations, Pipeline } from '../types';
import { escapeSearch } from '@/lib/utils/escape-search';

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

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type DealFormState = {
  saving: boolean;
  confirmDeleteOpen: boolean;
  title: string;
  selectedAccountId: string;
  pipelineId: string;
  stageId: string;
  amount: string;
  probability: string;
  closeDate: string;
  ownerId: string;
  contactId: string;
  origin: string;
  forecastCategory: string;
  description: string;
  leadSource: string;
  cronosCC: string;
  cronosContact: string;
  cronosEmail: string;
  consultantId: string;
  consultantRole: string;
  tags: string[];
  tariefGewenst: string;
  tariefAangeboden: string;
  accountSearch: string;
  accountResults: { id: string; name: string }[];
  accountName: string;
  showAccountDropdown: boolean;
  contacts: { id: string; name: string }[];
  benchConsultants: { id: string; name: string }[];
};

type DealFormActions = {
  setSaving: (v: boolean) => void;
  setConfirmDeleteOpen: (v: boolean) => void;
  setTitle: (v: string) => void;
  setSelectedAccountId: (v: string) => void;
  setAmount: (v: string) => void;
  setProbability: (v: string) => void;
  setCloseDate: (v: string) => void;
  setOwnerId: (v: string) => void;
  setContactId: (v: string) => void;
  setOrigin: (v: string) => void;
  setForecastCategory: (v: string) => void;
  setDescription: (v: string) => void;
  setLeadSource: (v: string) => void;
  setCronosCC: (v: string) => void;
  setCronosContact: (v: string) => void;
  setCronosEmail: (v: string) => void;
  setConsultantId: (v: string) => void;
  setConsultantRole: (v: string) => void;
  setTariefGewenst: (v: string) => void;
  setTariefAangeboden: (v: string) => void;
  handlePipelineChange: (id: string | null) => void;
  handleStageChange: (id: string | null) => void;
  handleAccountSearch: (query: string) => void;
  setAccountName: (v: string) => void;
  setAccountSearch: (v: string) => void;
  setShowAccountDropdown: (v: boolean) => void;
  toggleTag: (tag: string) => void;
  handleReopen: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSave: () => Promise<void>;
  onClose: () => void;
};

type DealFormMeta = {
  isEdit: boolean;
  isClosed: boolean;
  activePipeline: Pipeline | undefined;
  isConsultancy: boolean;
  sortedStages: Pipeline['stages'];
  pipelines: Pipeline[];
  owners: { id: string; name: string }[];
  propAccountId: string | undefined;
  deal: DealWithRelations | undefined;
  accountSearchRef: React.RefObject<HTMLDivElement | null>;
};

type DealFormContextValue = {
  state: DealFormState;
  actions: DealFormActions;
  meta: DealFormMeta;
};

const DealFormContext = createContext<DealFormContextValue | null>(null);

function useDealForm() {
  const ctx = use(DealFormContext);
  if (!ctx) throw new Error('useDealForm must be used within DealFormProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

function DealFormProvider({ open, onClose, accountId: propAccountId, pipelines, owners, deal, initialStageId, children }: Props & { children: React.ReactNode }) {
  const isEdit = !!deal;
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // --- Form state (consolidated) ---
  const initialStageIdValue = (() => {
    if (initialStageId) return initialStageId;
    if (deal?.stage_id) return deal.stage_id;
    const first = pipelines[0]?.stages.filter((s) => !s.is_closed).sort((a, b) => a.sort_order - b.sort_order)[0];
    return first?.id ?? '';
  })();

  const initialProbability = (() => {
    if (deal?.probability != null) return String(deal.probability);
    if (initialStageId) {
      const stage = pipelines.flatMap((p) => p.stages).find((s) => s.id === initialStageId);
      return stage ? String(stage.probability) : '';
    }
    const first = pipelines[0]?.stages.filter((s) => !s.is_closed).sort((a, b) => a.sort_order - b.sort_order)[0];
    return first ? String(first.probability) : '';
  })();

  type FormState = {
    title: string;
    selectedAccountId: string;
    pipelineId: string;
    stageId: string;
    amount: string;
    probability: string;
    closeDate: string;
    ownerId: string;
    contactId: string;
    origin: string;
    forecastCategory: string;
    description: string;
    leadSource: string;
    cronosCC: string;
    cronosContact: string;
    cronosEmail: string;
    consultantId: string;
    consultantRole: string;
    tags: string[];
    tariefGewenst: string;
    tariefAangeboden: string;
    accountSearch: string;
    accountResults: { id: string; name: string }[];
    accountName: string;
    showAccountDropdown: boolean;
  };

  const [form, updateForm] = useReducer(
    (prev: FormState, updates: Partial<FormState>) => ({ ...prev, ...updates }),
    {
      title: deal?.title ?? '',
      selectedAccountId: deal?.account_id ?? propAccountId ?? '',
      pipelineId: deal?.pipeline_id ?? pipelines[0]?.id ?? '',
      stageId: initialStageIdValue,
      amount: deal?.amount != null ? String(Number(deal.amount)) : '',
      probability: initialProbability,
      closeDate: deal?.close_date ?? '',
      ownerId: deal?.owner_id ?? '',
      contactId: deal?.contact_id ?? '',
      origin: deal?.origin ?? 'rechtstreeks',
      forecastCategory: deal?.forecast_category ?? '',
      description: deal?.description ?? '',
      leadSource: deal?.lead_source ?? '',
      cronosCC: deal?.cronos_cc ?? '',
      cronosContact: deal?.cronos_contact ?? '',
      cronosEmail: deal?.cronos_email ?? '',
      consultantId: deal?.consultant_id ?? '',
      consultantRole: deal?.consultant_role ?? '',
      tags: deal?.tags ?? [],
      tariefGewenst: deal?.tarief_gewenst != null ? String(Number(deal.tarief_gewenst)) : '',
      tariefAangeboden: deal?.tarief_aangeboden != null ? String(Number(deal.tarief_aangeboden)) : '',
      accountSearch: '',
      accountResults: [],
      accountName: deal?.account?.name ?? '',
      showAccountDropdown: false,
    },
  );

  // --- Derived ---
  const activePipeline = pipelines.find((p) => p.id === form.pipelineId);
  const isConsultancy = activePipeline?.type === 'consultancy';
  const sortedStages = (activePipeline?.stages ?? [])
    .filter((s) => !s.is_closed)
    .sort((a, b) => a.sort_order - b.sort_order);

  // --- Account search refs ---
  const accountSearchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Client-side fetch is intentional: when opened from an account page, the parent
  // passes only the account ID. Fetching the name here avoids threading the account
  // name through all call sites that open this modal.
  useEffect(() => {
    if (!propAccountId || form.accountName) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('accounts')
      .select('name')
      .eq('id', propAccountId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) updateForm({ accountName: data.name });
      });
    return () => { cancelled = true; };
  }, [propAccountId, form.accountName]);

  // Client-side search is intentional: search-as-you-type requires debounced queries
  // that depend on user input. This cannot be server-rendered.
  const handleAccountSearch = useCallback((query: string) => {
    updateForm({ accountSearch: query });
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      updateForm({ accountResults: [], showAccountDropdown: false });
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      const supabase = createBrowserClient();
      supabase
        .from('accounts')
        .select('id, name')
        .ilike('name', `%${escapeSearch(query)}%`)
        .limit(8)
        .then(({ data }) => {
          updateForm({
            accountResults: data ?? [],
            showAccountDropdown: (data ?? []).length > 0,
          });
        });
    }, 300);
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountSearchRef.current && !accountSearchRef.current.contains(e.target as Node)) {
        updateForm({ showAccountDropdown: false });
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Client-side fetch is intentional: contacts depend on which account is selected,
  // which changes dynamically as the user picks an account via search.
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (!form.selectedAccountId) {
      setContacts([]);
      return;
    }
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('account_id', form.selectedAccountId)
      .order('last_name')
      .then(({ data }) => {
        if (cancelled) return;
        setContacts((data ?? []).map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })));
      });
    return () => { cancelled = true; };
  }, [form.selectedAccountId]);

  // Client-side fetch is intentional: bench consultants are only needed for consultancy
  // pipeline type, which the user can switch to dynamically. Pre-fetching would be wasteful.
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
    const p = pipelines.find((pp) => pp.id === pid);
    const first = p?.stages.filter((s) => !s.is_closed).sort((a, b) => a.sort_order - b.sort_order)[0];
    updateForm({
      pipelineId: pid,
      stageId: first?.id ?? '',
      probability: first ? String(first.probability) : '',
    });
  }

  function handleStageChange(id: string | null) {
    const sid = id ?? '';
    const stage = activePipeline?.stages.find((s) => s.id === sid);
    updateForm({
      stageId: sid,
      ...(stage ? { probability: String(stage.probability) } : {}),
    });
  }

  // --- Tag toggle ---
  function toggleTag(tag: string) {
    updateForm({
      tags: form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag],
    });
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
    if (!form.title || !form.pipelineId || !form.stageId) {
      toast.error('Vul de verplichte velden in');
      return;
    }
    if (!form.selectedAccountId) {
      toast.error('Selecteer een account');
      return;
    }
    setSaving(true);

    const values = {
      title: form.title,
      account_id: form.selectedAccountId,
      pipeline_id: form.pipelineId,
      stage_id: form.stageId,
      amount: form.amount ? Number(form.amount) : undefined,
      probability: form.probability ? Number(form.probability) : undefined,
      owner_id: form.ownerId || undefined,
      contact_id: form.contactId || undefined,
      origin: (form.origin === 'rechtstreeks' || form.origin === 'cronos') ? form.origin as 'rechtstreeks' | 'cronos' : undefined,
      forecast_category: (['Commit', 'Best Case', 'Pipeline', 'Omit'].includes(form.forecastCategory) ? form.forecastCategory : undefined) as 'Commit' | 'Best Case' | 'Pipeline' | 'Omit' | undefined,
      description: form.description || undefined,
      close_date: form.closeDate || undefined,
      lead_source: form.leadSource || undefined,
      cronos_cc: form.origin === 'cronos' ? form.cronosCC || undefined : undefined,
      cronos_contact: form.origin === 'cronos' ? form.cronosContact || undefined : undefined,
      cronos_email: form.origin === 'cronos' ? form.cronosEmail || undefined : undefined,
      consultant_id: form.consultantId || undefined,
      consultant_role: form.consultantRole || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      tarief_gewenst: form.tariefGewenst ? Number(form.tariefGewenst) : undefined,
      tarief_aangeboden: form.tariefAangeboden ? Number(form.tariefAangeboden) : undefined,
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

  const isClosed = !!deal?.closed_type;

  const state: DealFormState = {
    ...form,
    saving, confirmDeleteOpen,
    contacts, benchConsultants,
  };

  const actions: DealFormActions = {
    setSaving, setConfirmDeleteOpen,
    setTitle: (v) => updateForm({ title: v }),
    setSelectedAccountId: (v) => updateForm({ selectedAccountId: v }),
    setAmount: (v) => updateForm({ amount: v }),
    setProbability: (v) => updateForm({ probability: v }),
    setCloseDate: (v) => updateForm({ closeDate: v }),
    setOwnerId: (v) => updateForm({ ownerId: v }),
    setContactId: (v) => updateForm({ contactId: v }),
    setOrigin: (v) => updateForm({ origin: v }),
    setForecastCategory: (v) => updateForm({ forecastCategory: v }),
    setDescription: (v) => updateForm({ description: v }),
    setLeadSource: (v) => updateForm({ leadSource: v }),
    setCronosCC: (v) => updateForm({ cronosCC: v }),
    setCronosContact: (v) => updateForm({ cronosContact: v }),
    setCronosEmail: (v) => updateForm({ cronosEmail: v }),
    setConsultantId: (v) => updateForm({ consultantId: v }),
    setConsultantRole: (v) => updateForm({ consultantRole: v }),
    setTariefGewenst: (v) => updateForm({ tariefGewenst: v }),
    setTariefAangeboden: (v) => updateForm({ tariefAangeboden: v }),
    handlePipelineChange, handleStageChange,
    handleAccountSearch,
    setAccountName: (v) => updateForm({ accountName: v }),
    setAccountSearch: (v) => updateForm({ accountSearch: v }),
    setShowAccountDropdown: (v) => updateForm({ showAccountDropdown: v }),
    toggleTag, handleReopen, handleDelete, handleSave, onClose,
  };

  const meta: DealFormMeta = {
    isEdit, isClosed, activePipeline, isConsultancy, sortedStages,
    pipelines, owners, propAccountId, deal, accountSearchRef,
  };

  return (
    <DealFormContext value={{ state, actions, meta }}>
      {children}
    </DealFormContext>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ClosedDealBanner() {
  const { meta, actions } = useDealForm();
  if (!meta.isClosed || !meta.deal) return null;
  const { deal } = meta;

  return (
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
        onClick={actions.handleReopen}
        className="flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100 whitespace-nowrap"
      >
        <RotateCcw className="h-3 w-3" />
        Heropen
      </button>
    </div>
  );
}

function AccountSearchField() {
  const { state, actions, meta } = useDealForm();

  if (meta.propAccountId) {
    return (
      <div className="space-y-1.5">
        <Label>Account *</Label>
        <Input value={state.accountName} disabled />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>Account *</Label>
      <div className="relative" ref={meta.accountSearchRef}>
        <Input
          value={state.selectedAccountId ? state.accountName : state.accountSearch}
          onChange={(e) => {
            if (state.selectedAccountId) {
              actions.setSelectedAccountId('');
              actions.setAccountName('');
              actions.setContactId('');
            }
            actions.handleAccountSearch(e.target.value);
          }}
          placeholder="Zoek account..."
          onFocus={() => {
            if (state.accountResults.length > 0) actions.setShowAccountDropdown(true);
          }}
        />
        {state.selectedAccountId && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            onClick={() => {
              actions.setSelectedAccountId('');
              actions.setAccountName('');
              actions.setAccountSearch('');
              actions.setContactId('');
            }}
          >
            ✕
          </button>
        )}
        {state.showAccountDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md">
            {state.accountResults.map((a) => (
              <button
                key={a.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  actions.setSelectedAccountId(a.id);
                  actions.setAccountName(a.name);
                  actions.setAccountSearch('');
                  actions.setShowAccountDropdown(false);
                }}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CronosDetailsSection() {
  const { state, actions } = useDealForm();
  if (state.origin !== 'cronos') return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
        <Network className="h-3.5 w-3.5" />
        Cronos details
      </p>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Competence Center</label>
        <Input
          value={state.cronosCC}
          onChange={(e) => actions.setCronosCC(e.target.value)}
          placeholder="bv. Induxx, Humix, Osudio..."
          className="bg-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Contactpersoon Cronos</label>
        <Input
          value={state.cronosContact}
          onChange={(e) => actions.setCronosContact(e.target.value)}
          placeholder="Naam contactpersoon"
          className="bg-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">E-mail Cronos</label>
        <Input
          type="email"
          value={state.cronosEmail}
          onChange={(e) => actions.setCronosEmail(e.target.value)}
          placeholder="contact@cronos.be"
          className="bg-white"
        />
      </div>
    </div>
  );
}

function ConsultancyFields() {
  const { state, actions, meta } = useDealForm();
  if (!meta.isConsultancy) return null;

  return (
    <>
      <div className="space-y-1.5">
        <Label>Bench consultant</Label>
        <Select value={state.consultantId} onValueChange={(v) => actions.setConsultantId(v ?? '')}>
          <SelectTrigger>
            {state.benchConsultants.find((c) => c.id === state.consultantId)?.name ?? '— Selecteer consultant —'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Selecteer consultant —</SelectItem>
            {state.benchConsultants.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Rol bij klant</Label>
        <Input
          value={state.consultantRole}
          onChange={(e) => actions.setConsultantRole(e.target.value)}
          placeholder="bv. Dev Senior, Business Analist..."
        />
      </div>
    </>
  );
}

function DealFormLeftColumn() {
  const { state, actions, meta } = useDealForm();

  return (
    <div className="space-y-4">
      {/* Titel */}
      <div className="space-y-1.5">
        <Label>Titel *</Label>
        <Input value={state.title} onChange={(e) => actions.setTitle(e.target.value)} placeholder="Deal naam" />
      </div>

      {/* Account */}
      <AccountSearchField />

      {/* Pipeline */}
      <div className="space-y-1.5">
        <Label>Pipeline *</Label>
        <Select value={state.pipelineId} onValueChange={actions.handlePipelineChange}>
          <SelectTrigger>
            {meta.activePipeline?.name ?? 'Selecteer...'}
          </SelectTrigger>
          <SelectContent>
            {meta.pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stage */}
      <div className="space-y-1.5">
        <Label>Stage *</Label>
        <Select value={state.stageId} onValueChange={actions.handleStageChange}>
          <SelectTrigger>
            {meta.sortedStages.find((s) => s.id === state.stageId)?.name ?? 'Selecteer...'}
          </SelectTrigger>
          <SelectContent>
            {meta.sortedStages.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount fields — conditional on pipeline type */}
      {meta.isConsultancy ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Gewenst tarief (€/u)</Label>
            <Input
              type="number"
              min="0"
              value={state.tariefGewenst}
              onChange={(e) => actions.setTariefGewenst(e.target.value)}
              placeholder="bv. 95"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Aangeboden tarief (€/u)</Label>
            <Input
              type="number"
              min="0"
              value={state.tariefAangeboden}
              onChange={(e) => actions.setTariefAangeboden(e.target.value)}
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
            value={state.amount}
            onChange={(e) => actions.setAmount(e.target.value)}
          />
        </div>
      )}

      {/* Close date + Probability side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Sluitdatum</Label>
          <DatePicker value={state.closeDate} onChange={actions.setCloseDate} />
        </div>
        <div className="space-y-1.5">
          <Label>Kans %</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={state.probability}
            onChange={(e) => actions.setProbability(e.target.value)}
          />
        </div>
      </div>

      {/* Owner */}
      <div className="space-y-1.5">
        <Label>Eigenaar</Label>
        <Select value={state.ownerId} onValueChange={(v) => actions.setOwnerId(v ?? '')}>
          <SelectTrigger>
            {meta.owners.find((o) => o.id === state.ownerId)?.name ?? '— geen —'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— geen —</SelectItem>
            {meta.owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DealFormRightColumn() {
  const { state, actions, meta } = useDealForm();

  return (
    <div className="space-y-4">
      {/* Consultant fields (consultancy pipeline only) */}
      <ConsultancyFields />

      {/* Contact */}
      <div className="space-y-1.5">
        <Label>Contact</Label>
        <Select value={state.contactId} onValueChange={(v) => actions.setContactId(v ?? '')}>
          <SelectTrigger>
            {state.contacts.find((c) => c.id === state.contactId)?.name ?? '— Selecteer contact —'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Selecteer contact —</SelectItem>
            {state.contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead bron */}
      <div className="space-y-1.5">
        <Label>Lead bron</Label>
        <Select value={state.leadSource} onValueChange={(v) => actions.setLeadSource(v ?? '')}>
          <SelectTrigger>
            {state.leadSource || '— Selecteer bron —'}
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
              onClick={() => actions.setOrigin(value)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                state.origin === value
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
      <CronosDetailsSection />

      {/* Beschrijving */}
      <div className="space-y-1.5">
        <Label>Beschrijving</Label>
        <Textarea
          rows={state.origin === 'cronos' ? 2 : 4}
          value={state.description}
          onChange={(e) => actions.setDescription(e.target.value)}
          placeholder="Omschrijving van de deal..."
        />
      </div>

      {/* Tags / Services (non-consultancy only) */}
      {!meta.isConsultancy && (
        <div className="space-y-1.5">
          <Label>Tags / Services</Label>
          <div className="flex flex-wrap gap-1.5">
            {DEAL_TAGS.map((tag) => {
              const active = state.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => actions.toggleTag(tag)}
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
  );
}

function DealFormFooter() {
  const { state, actions, meta } = useDealForm();

  return (
    <div className="flex justify-between mt-6 pt-4 border-t">
      <div>
        {meta.isEdit && (
          <ConfirmDialog
            title="Deal verwijderen"
            description="Weet je zeker dat je deze deal wilt verwijderen? Dit kan niet ongedaan worden."
            onConfirm={actions.handleDelete}
            variant="destructive"
            open={state.confirmDeleteOpen}
            onOpenChange={actions.setConfirmDeleteOpen}
          />
        )}
        {meta.isEdit && (
          <Button variant="destructive" size="sm" onClick={() => actions.setConfirmDeleteOpen(true)}>
            <Trash2 />
            Verwijderen
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={actions.onClose}>Annuleren</Button>
        <Button onClick={actions.handleSave} disabled={state.saving || !state.title}>
          <Save />
          {state.saving ? 'Opslaan...' : meta.isEdit ? 'Bijwerken' : 'Aanmaken'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content (reads context)
// ---------------------------------------------------------------------------

function DealFormContent() {
  const { actions, meta } = useDealForm();

  return (
    <Modal open title={meta.isEdit ? 'Deal bewerken' : 'Nieuwe deal'} onClose={actions.onClose} size="extra-wide">
      <ClosedDealBanner />
      <div className="grid grid-cols-2 gap-6">
        <DealFormLeftColumn />
        <DealFormRightColumn />
      </div>
      <DealFormFooter />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Exported component — identical API
// ---------------------------------------------------------------------------

export function DealEditModal(props: Props) {
  return (
    <DealFormProvider {...props}>
      <DealFormContent />
    </DealFormProvider>
  );
}
