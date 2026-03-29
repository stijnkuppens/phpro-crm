'use client';

import { useReducer, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase/client';
import { createDeal } from '@/features/deals/actions/create-deal';
import { updateDeal } from '@/features/deals/actions/update-deal';
import { deleteDeal } from '@/features/deals/actions/delete-deal';
import { reopenDeal } from '@/features/deals/actions/reopen-deal';
import { escapeSearch } from '@/lib/utils/escape-search';
import { DealFormContext } from '@/features/deals/components/deal-form-context';
import type { DealFormState, DealFormActions, DealFormMeta } from '@/features/deals/components/deal-form-context';
import type { DealWithRelations, Pipeline } from '@/features/deals/types';

export type DealEditModalProps = {
  open: boolean;
  onClose: () => void;
  accountId?: string;
  pipelines: Pipeline[];
  owners: { id: string; name: string }[];
  accounts?: { id: string; name: string }[];
  deal?: DealWithRelations;
  initialStageId?: string;
};

export const LEAD_SOURCES = ['E-mail', 'Webformulier', 'Partner', 'Campagne', 'Social Media', 'Telefonisch', 'Evenement', 'Referral', 'Cold outreach', 'Andere'];

export const DEAL_TAGS = ['Adobe Commerce', 'Marello', 'Magento', 'OroCommerce', 'Sulu CMS', 'Custom Dev', 'Pimcore', 'PIM', 'ERP Integratie', 'Analytics', 'SEO/SEA', 'UX / Design', 'Support', 'Training', 'Andere'];

export function DealFormProvider({ open, onClose, accountId: propAccountId, pipelines, owners, accounts: accountOptions = [], deal, initialStageId, children }: DealEditModalProps & { children: React.ReactNode }) {
  const isEdit = !!deal;
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

  // Reset contacts when account changes (render-phase setState to avoid lint error)
  const [prevAccountId, setPrevAccountId] = useState(form.selectedAccountId);
  if (prevAccountId !== form.selectedAccountId) {
    setPrevAccountId(form.selectedAccountId);
    if (!form.selectedAccountId) setContacts([]);
  }

  useEffect(() => {
    if (!form.selectedAccountId) return;
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
    confirmDeleteOpen,
    contacts, benchConsultants,
  };

  const actions: DealFormActions = {
    setConfirmDeleteOpen,
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
    pipelines, owners, propAccountId, deal, accountSearchRef, accountOptions,
  };

  return (
    <DealFormContext value={{ state, actions, meta }}>
      {children}
    </DealFormContext>
  );
}
