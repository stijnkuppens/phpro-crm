'use client';

import { ComboboxFilter } from '@/components/admin/combobox-filter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDealForm } from '@/features/deals/components/deal-form-context';

export function AccountSearchField() {
  const { state, actions, meta } = useDealForm();

  // When opened from an account page, show the account name as a disabled input
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
      <ComboboxFilter
        options={meta.accountOptions.map((a) => ({ value: a.id, label: a.name }))}
        value={state.selectedAccountId || 'all'}
        onValueChange={(v) => {
          const id = v === 'all' ? '' : v;
          const name = meta.accountOptions.find((a) => a.id === id)?.name ?? '';
          actions.setSelectedAccountId(id);
          actions.setAccountName(name);
          actions.setContactId('');
        }}
        placeholder="Zoek account..."
        searchPlaceholder="Zoek account..."
        className="w-full"
      />
    </div>
  );
}
