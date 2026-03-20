# Unified DataTable Design

**Date:** 2026-03-20
**Status:** Approved

## Problem

Every list in the app handles row actions, search, filtering, and selection differently. Accounts use `onRowClick` + chevron column, Employees add an inline "Bekijk" button in the columns file, Tasks render icon buttons outside the DataTable, and most lists have no actions at all. Bulk select exists in DataTable but nothing uses it.

## Design

### Row Actions

Add a `rowActions` prop to DataTable. When provided, an actions column is auto-appended as the last column. Each action renders as a small ghost icon button — matching the existing tasks page pattern (pencil + trash icons on the right).

```tsx
type RowAction<T> = {
  icon: LucideIcon;
  label: string;              // tooltip + sr-only text
  onClick: (row: T) => void;
  variant?: 'ghost' | 'destructive';
  confirm?: { title: string; description: string };
};

// Prop on DataTable
rowActions?: (row: T) => RowAction<T>[];
```

Actions with `confirm` render inside a `ConfirmDialog` (already exists in the codebase). The `variant: 'destructive'` applies `text-destructive` styling to the icon.

### Bulk Actions

DataTable already has `bulkActions` with checkbox column and selection state. No API changes needed — just start passing it from list components.

Initial bulk action: **delete selected** with confirmation dialog.

### Props Cleanup

Remove unused props from DataTable:
- `searchColumn` — no list uses it; all lists build their own filter UI externally
- `searchPlaceholder` — unused (tied to searchColumn)
- `onSort` — unused
- `onRowClick` — replaced by view icon in row actions

### Per-Entity Actions

| Entity     | View (Eye) | Edit (Pencil) | Delete (Trash2) | Bulk Delete | Notes |
|------------|-----------|---------------|-----------------|-------------|-------|
| Accounts   | yes       | yes           | yes             | yes         | View → `/admin/accounts/[id]` |
| Contacts   | yes       | yes           | yes             | yes         | View → `/admin/accounts/[accountId]` (contact's parent) |
| Deals      | yes       | yes           | yes             | yes         | View → open detail (no detail route yet, use modal or drawer) |
| Tasks      | no        | yes           | yes             | yes         | No detail page |
| People     | yes       | yes           | yes             | yes         | View → `/admin/people/[id]` |
| Activities | no        | yes           | yes             | yes         | No detail page |
| Audit      | —         | —             | —               | —           | Keep as-is (read-only, info modal) |

### Column Cleanup

Per entity, remove ad-hoc action patterns:
- **Accounts columns.tsx**: Remove chevron column (row 141-147)
- **People employee-list.tsx**: Remove manually added "Bekijk" action column
- **Tasks**: Icon buttons move from custom layout into DataTable row actions

### DataTable Component Changes

1. Accept `rowActions` prop
2. When provided, append an actions `<TableCell>` to each row with icon buttons
3. Actions column: right-aligned, no header text, `enableSorting: false`
4. Remove `searchColumn`, `searchPlaceholder`, `onSort`, `onRowClick` props
5. No other changes to existing behavior (pagination, loading, sorting all stay)

### Visual Spec

Row action buttons:
- Size: `h-8 w-8` icon buttons (same as tasks page)
- Variant: `ghost`
- Icon size: `h-4 w-4`
- Delete icon: `text-muted-foreground hover:text-destructive`
- Other icons: `text-muted-foreground`
- Spacing: `gap-1` between buttons
- Alignment: right-aligned in cell

Bulk action bar (existing, no changes needed):
- Shows count of selected items
- Action buttons with optional confirmation dialog

## Files to Modify

- `src/components/admin/data-table.tsx` — add rowActions, remove unused props
- `src/features/accounts/columns.tsx` — remove chevron column
- `src/features/accounts/components/account-list.tsx` — add rowActions + bulkActions, remove onRowClick
- `src/features/contacts/components/contact-list.tsx` — add rowActions + bulkActions
- `src/features/deals/components/deal-list.tsx` — add rowActions + bulkActions
- `src/features/tasks/components/task-list.tsx` — migrate icon buttons to DataTable rowActions
- `src/features/people/components/employee-list.tsx` — replace inline "Bekijk" with rowActions + bulkActions
- `src/features/activities/components/activity-list.tsx` — add rowActions + bulkActions

## Out of Scope

- Inline editing
- Column visibility toggles
- Row expansion
- Export functionality
- Additional bulk actions beyond delete
