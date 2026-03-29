'use client';

import { createContext, use } from 'react';
import type { DealWithRelations, Pipeline } from '@/features/deals/types';

export type DealFormState = {
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

export type DealFormActions = {
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

export type DealFormMeta = {
  isEdit: boolean;
  isClosed: boolean;
  activePipeline: Pipeline | undefined;
  isConsultancy: boolean;
  sortedStages: Pipeline['stages'];
  pipelines: Pipeline[];
  owners: { id: string; name: string }[];
  accountOptions: { id: string; name: string }[];
  propAccountId: string | undefined;
  deal: DealWithRelations | undefined;
  accountSearchRef: React.RefObject<HTMLDivElement | null>;
};

export type DealFormContextValue = {
  state: DealFormState;
  actions: DealFormActions;
  meta: DealFormMeta;
};

export const DealFormContext = createContext<DealFormContextValue | null>(null);

export function useDealForm() {
  const ctx = use(DealFormContext);
  if (!ctx) throw new Error('useDealForm must be used within DealFormProvider');
  return ctx;
}
