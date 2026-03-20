# Unified DataTable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all data grids with consistent row actions (view/edit/delete icon buttons), bulk delete, and cleaned-up props.

**Architecture:** Add `rowActions` prop to DataTable that auto-appends an actions column with icon buttons. Remove unused props. Migrate all 6 list components to use the new API.

**Tech Stack:** React 19, TanStack Table, Lucide icons, shadcn/ui Tooltip + ConfirmDialog

---

### Task 1: Upgrade DataTable Component

**Files:**
- Modify: `src/components/admin/data-table.tsx`

- [ ] **Step 1: Add RowAction type and update DataTableProps**

Replace the current props type block (lines 42-54) with:

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

type RowAction<T> = {
  icon: LucideIcon;
  label: string;
  onClick: (row: T) => void;
  variant?: 'ghost' | 'destructive';
  confirm?: { title: string; description: string };
};

type BulkAction = {
  label: string;
  action: (ids: string[]) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  confirm?: { title: string; description: string };
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  pagination?: { page: number; pageSize: number; total: number };
  onPageChange?: (page: number) => void;
  rowActions?: (row: T) => RowAction<T>[];
  bulkActions?: BulkAction[];
  loading?: boolean;
};
```

Remove the `searchColumn`, `searchPlaceholder`, `onSort`, `onSearch`, `onRowClick` props and their usages from the function signature and body. Remove the `searchQuery` state and the search Input block (lines 113-121). Remove the `onRowClick` className/onClick from TableRow (lines 200-201).

- [ ] **Step 2: Render row action buttons in each row**

After the existing `{row.getVisibleCells().map(...)}` block, add an actions cell when `rowActions` is provided:

```tsx
{rowActions && (
  <TableCell className="w-0 text-right">
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider>
        {rowActions(row.original).map((action) => {
          const iconButton = (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${action.variant === 'destructive' ? 'text-muted-foreground hover:text-destructive' : 'text-muted-foreground'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!action.confirm) action.onClick(row.original);
              }}
            >
              <action.icon className="h-4 w-4" />
              <span className="sr-only">{action.label}</span>
            </Button>
          );

          return action.confirm ? (
            <ConfirmDialog
              key={action.label}
              title={action.confirm.title}
              description={action.confirm.description}
              onConfirm={() => action.onClick(row.original)}
              trigger={
                <Tooltip>
                  <TooltipTrigger render={iconButton} />
                  <TooltipContent>{action.label}</TooltipContent>
                </Tooltip>
              }
            />
          ) : (
            <Tooltip key={action.label}>
              <TooltipTrigger render={iconButton} />
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  </TableCell>
)}
```

- [ ] **Step 3: Add actions header cell and update empty/loading states**

In the header row, after the `{headerGroup.headers.map(...)}` block, add:

```tsx
{rowActions && <TableHead className="w-0" />}
```

Update the loading skeleton to account for the extra column — change `allColumns.map` to include +1 cell when rowActions is present:

```tsx
{Array.from({ length: allColumns.length + (rowActions ? 1 : 0) }).map((_, j) => (
```

Update the empty state colSpan:

```tsx
<TableCell colSpan={allColumns.length + (rowActions ? 1 : 0)} className="h-24 text-center">
```

- [ ] **Step 4: Export RowAction and BulkAction types**

At the bottom of the file, add:

```tsx
export type { RowAction, BulkAction };
```

- [ ] **Step 5: Verify the build compiles**

Run: `npx next build --no-lint 2>&1 | head -30` or `npx tsc --noEmit`
Expected: No type errors in data-table.tsx

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/data-table.tsx
git commit -m "feat: add rowActions prop to DataTable with icon buttons and tooltips"
```

---

### Task 2: Migrate Accounts List

**Files:**
- Modify: `src/features/accounts/components/account-list.tsx`
- Modify: `src/features/accounts/columns.tsx` (remove chevron column)

- [ ] **Step 1: Remove chevron column from columns.tsx**

Delete the chevron column definition (the last column object with `id: 'chevron'`, lines 141-147).

- [ ] **Step 2: Update account-list.tsx**

Replace the current imports and add rowActions + bulkActions:

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { AccountFiltersBar } from './account-filters';
import { accountColumns } from '../columns';
import { deleteAccount } from '../actions/delete-account';
import type { Account, AccountFilters } from '../types';

const PAGE_SIZE = 25;

type AccountListProps = {
  initialData?: Account[];
  initialCount?: number;
};

export function AccountList({ initialData, initialCount }: AccountListProps) {
  const router = useRouter();
  const { data, total, loading, fetchList } = useEntity<Account>({
    table: 'accounts',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AccountFilters>({});

  const load = useCallback(() => {
    const orFilter = filters.search
      ? `name.ilike.%${filters.search}%,domain.ilike.%${filters.search}%`
      : undefined;
    const eqFilters: Record<string, string> = {};
    if (filters.type) eqFilters.type = filters.type;
    if (filters.status) eqFilters.status = filters.status;
    if (filters.owner_id) eqFilters.owner_id = filters.owner_id;
    if (filters.country) eqFilters.country = filters.country;

    fetchList({
      page,
      orFilter,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, filters]);

  useEffect(() => {
    if (initialData && page === 1 && !filters.search && !filters.type && !filters.status && !filters.owner_id && !filters.country) return;
    load();
  }, [load, initialData, page, filters]);

  const handleDelete = async (id: string) => {
    const result = await deleteAccount(id);
    if (result.ok) {
      toast.success('Account verwijderd');
      load();
    } else {
      toast.error(result.error as string);
    }
  };

  return (
    <div className="space-y-4">
      <AccountFiltersBar filters={filters} onFilterChange={setFilters} />
      <DataTable
        columns={accountColumns}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        rowActions={(row) => [
          { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/accounts/${row.id}`) },
          { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.id}`) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Account verwijderen?', description: 'Dit verwijdert het account en alle gekoppelde gegevens.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Accounts verwijderen?', description: 'Dit verwijdert de geselecteerde accounts permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
        loading={loading}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/features/accounts/components/account-list.tsx src/features/accounts/columns.tsx
git commit -m "feat: add row actions and bulk delete to accounts datagrid"
```

---

### Task 3: Migrate Contacts List

**Files:**
- Modify: `src/features/contacts/components/contact-list.tsx`

- [ ] **Step 1: Add row actions and bulk delete**

Add imports for `Eye`, `Pencil`, `Trash2` from lucide-react, `useRouter` from next/navigation, `toast` from sonner, and `deleteContact` from `../actions/delete-contact`.

Add `const router = useRouter();` after the hooks.

Add a `handleDelete` function (same pattern as accounts, calling `deleteContact`).

Replace the `<DataTable>` call to include `rowActions` and `bulkActions`:

```tsx
<DataTable
  columns={contactColumns as any}
  data={data}
  pagination={{ page, pageSize: PAGE_SIZE, total }}
  onPageChange={setPage}
  rowActions={(row) => [
    { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
    { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
    { icon: Trash2, label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Contact verwijderen?', description: 'Dit verwijdert het contact permanent.' }, onClick: () => handleDelete(row.id) },
  ]}
  bulkActions={[
    { label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Contacten verwijderen?', description: 'Dit verwijdert de geselecteerde contacten permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
  ]}
  loading={loading}
/>
```

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit
git add src/features/contacts/components/contact-list.tsx
git commit -m "feat: add row actions and bulk delete to contacts datagrid"
```

---

### Task 4: Migrate Deals List

**Files:**
- Modify: `src/features/deals/components/deal-list.tsx`

- [ ] **Step 1: Add row actions and bulk delete**

The DealList currently receives `deals` from its parent — it doesn't own the fetch. Add imports and pass rowActions/bulkActions. Since there's no deal detail route, the Eye button navigates to the deal's account:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/admin/data-table';
import { dealColumns } from '../columns';
import { deleteDeal } from '../actions/delete-deal';
import type { DealWithRelations } from '../types';

type Props = {
  deals: DealWithRelations[];
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
  loading: boolean;
};

export function DealList({ deals, page, total, onPageChange, onRefresh, loading }: Props) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const result = await deleteDeal(id);
    if (result.ok) {
      toast.success('Deal verwijderd');
      onRefresh?.();
    } else {
      toast.error(result.error as string);
    }
  };

  return (
    <DataTable
      columns={dealColumns}
      data={deals}
      pagination={{ page, pageSize: 50, total }}
      onPageChange={onPageChange}
      rowActions={(row) => [
        { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
        { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.account_id}`) },
        { icon: Trash2, label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Deal verwijderen?', description: 'Dit verwijdert de deal permanent.' }, onClick: () => handleDelete(row.id) },
      ]}
      bulkActions={[
        { label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Deals verwijderen?', description: 'Dit verwijdert de geselecteerde deals permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
      ]}
      loading={loading}
    />
  );
}
```

Note: `DealWithRelations` needs `account_id` — check the type has it. If the parent passes `onRefresh`, call it after delete. If the parent doesn't pass `onRefresh` yet, update the parent to do so.

- [ ] **Step 2: Update parent component if needed**

Check the deals page or parent component that renders `<DealList>`. If it manages fetch, add an `onRefresh` callback that re-triggers the fetch. This may require reading the parent to understand the pattern.

- [ ] **Step 3: Verify build and commit**

```bash
npx tsc --noEmit
git add src/features/deals/components/deal-list.tsx
# Also add parent if modified
git commit -m "feat: add row actions and bulk delete to deals datagrid"
```

---

### Task 5: Migrate Tasks List

**Files:**
- Modify: `src/features/tasks/components/task-list.tsx`

- [ ] **Step 1: Add row actions and bulk delete**

Add imports for `Pencil`, `Trash2`, `toast`, `deleteTask`. No `Eye` icon — tasks have no detail page.

Add `handleDelete` function, add `rowActions` and `bulkActions` to DataTable:

```tsx
rowActions={(row) => [
  { icon: Pencil, label: 'Bewerken', onClick: () => { /* TODO: open edit modal when available */ } },
  { icon: Trash2, label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Taak verwijderen?', description: 'Dit verwijdert de taak permanent.' }, onClick: () => handleDelete(row.id) },
]}
bulkActions={[
  { label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Taken verwijderen?', description: 'Dit verwijdert de geselecteerde taken permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
]}
```

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit
git add src/features/tasks/components/task-list.tsx
git commit -m "feat: add row actions and bulk delete to tasks datagrid"
```

---

### Task 6: Migrate People/Employees List

**Files:**
- Modify: `src/features/people/components/employee-list.tsx`

- [ ] **Step 1: Replace inline "Bekijk" button with rowActions**

Remove the manually added actions column (lines 48-61 where `columns` is constructed). Use `employeeColumns` directly. Add imports for `Eye`, `Pencil`, `Trash2`, `toast`, `deleteEmployee`.

Add `handleDelete` function. Replace the `<DataTable>` usage:

```tsx
<DataTable
  columns={employeeColumns as any}
  data={data}
  pagination={{ page, pageSize: PAGE_SIZE, total }}
  onPageChange={setPage}
  rowActions={(row) => [
    { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/people/${row.id}`) },
    { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/people/${row.id}`) },
    { icon: Trash2, label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Medewerker verwijderen?', description: 'Dit verwijdert de medewerker permanent.' }, onClick: () => handleDelete(row.id) },
  ]}
  bulkActions={[
    { label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Medewerkers verwijderen?', description: 'Dit verwijdert de geselecteerde medewerkers permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
  ]}
  loading={loading}
/>
```

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit
git add src/features/people/components/employee-list.tsx
git commit -m "feat: add row actions and bulk delete to employees datagrid"
```

---

### Task 7: Migrate Activities List

**Files:**
- Modify: `src/features/activities/components/activity-list.tsx`

- [ ] **Step 1: Add row actions and bulk delete**

Add imports for `Pencil`, `Trash2`, `toast`, `deleteActivity`. No `Eye` — activities have no detail page.

Add `handleDelete`, update `<DataTable>`:

```tsx
rowActions={(row) => [
  { icon: Pencil, label: 'Bewerken', onClick: () => { /* TODO: open edit modal when available */ } },
  { icon: Trash2, label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Activiteit verwijderen?', description: 'Dit verwijdert de activiteit permanent.' }, onClick: () => handleDelete(row.id) },
]}
bulkActions={[
  { label: 'Verwijderen', variant: 'destructive', confirm: { title: 'Activiteiten verwijderen?', description: 'Dit verwijdert de geselecteerde activiteiten permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
]}
```

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit
git add src/features/activities/components/activity-list.tsx
git commit -m "feat: add row actions and bulk delete to activities datagrid"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Run dev server and spot-check**

Run: `npm run dev`
Verify:
- Accounts list: eye/pencil/trash icons visible, bulk select works, chevron gone
- Contacts list: eye/pencil/trash icons visible
- Deals list: eye/pencil/trash icons visible
- Tasks list: pencil/trash icons visible
- People list: eye/pencil/trash icons visible, "Bekijk" button gone
- Activities list: pencil/trash icons visible
- Audit list: unchanged (no row actions)

- [ ] **Step 3: Check no unused imports remain**

Run: `npx tsc --noEmit` will catch unused imports in strict mode.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: unified DataTable cleanup"
```
