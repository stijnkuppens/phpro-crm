'use client';

import { Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDealForm } from '@/features/deals/components/deal-form-context';

export function CronosDetailsSection() {
  const { state, actions } = useDealForm();
  if (state.origin !== 'cronos') return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-3">
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
        <Network className="h-3.5 w-3.5" />
        Cronos details
      </p>
      <div className="space-y-1">
        <label
          htmlFor="cronos-cc"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Competence Center
        </label>
        <Input
          id="cronos-cc"
          value={state.cronosCC}
          onChange={(e) => actions.setCronosCC(e.target.value)}
          placeholder="bv. Induxx, Humix, Osudio..."
          className="bg-white dark:bg-background"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="cronos-contact"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Contactpersoon Cronos
        </label>
        <Input
          id="cronos-contact"
          value={state.cronosContact}
          onChange={(e) => actions.setCronosContact(e.target.value)}
          placeholder="Naam contactpersoon"
          className="bg-white dark:bg-background"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="cronos-email"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          E-mail Cronos
        </label>
        <Input
          id="cronos-email"
          type="email"
          value={state.cronosEmail}
          onChange={(e) => actions.setCronosEmail(e.target.value)}
          placeholder="contact@cronos.be"
          className="bg-white dark:bg-background"
        />
      </div>
    </div>
  );
}
