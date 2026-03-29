'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDealForm } from '@/features/deals/components/deal-form-context';

export function AccountSearchField() {
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
