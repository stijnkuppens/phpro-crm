'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useTableSettings } from '@/lib/hooks/use-table-settings';
import { ColumnSettings } from '@/components/admin/column-settings';
import { FilterBar } from '@/components/admin/filter-bar';
import { DataTableFilters, type FilterOption } from '@/components/admin/data-table-filters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

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

type DataTableBaseProps<T> = {
  tableId?: string;
  columns: ColumnDef<T>[];
  data: T[];
  pagination?: { page: number; pageSize: number; total: number };
  onPageChange?: (page: number) => void;
  initialSorting?: SortingState;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => RowAction<T>[];
  bulkActions?: BulkAction[];
  loading?: boolean;
  refreshing?: boolean;
};

type DataTableFilterProps =
  | { /** Custom filter bar (overrides auto-generated filters) */ filterBar: React.ReactNode; filters?: never; onFilterChange?: never; filterOptions?: never }
  | { filterBar?: never; /** Auto-generated filters: current filter state keyed by column accessorKey */ filters: Record<string, string | undefined>; /** Called when any filter changes */ onFilterChange: (filters: Record<string, string | undefined>) => void; /** Dynamic options keyed by column accessorKey */ filterOptions?: Record<string, FilterOption[]> }
  | { filterBar?: never; filters?: never; onFilterChange?: never; filterOptions?: never };

type DataTableProps<T> = DataTableBaseProps<T> & DataTableFilterProps;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RowActionButton<T extends Record<string, any>>({ action, row }: { action: RowAction<T>; row: T }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${action.variant === 'destructive' ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:text-primary-action hover:bg-primary/10'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (action.confirm) {
                  setConfirmOpen(true);
                } else {
                  action.onClick(row);
                }
              }}
            >
              <action.icon className="h-4 w-4" />
              <span className="sr-only">{action.label}</span>
            </Button>
          }
        />
        <TooltipContent>{action.label}</TooltipContent>
      </Tooltip>
      {action.confirm && (
        <ConfirmDialog
          title={action.confirm.title}
          description={action.confirm.description}
          onConfirm={() => action.onClick(row)}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        />
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  tableId,
  filterBar,
  filters,
  onFilterChange,
  filterOptions,
  columns,
  data,
  pagination,
  onPageChange,
  initialSorting,
  onRowClick,
  rowActions,
  bulkActions,
  loading,
  refreshing,
}: DataTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);

  const { settings, updateVisibility, updateOrder, reset } = useTableSettings(tableId ?? '');

  // Initialize with defaults to avoid hydration mismatch — localStorage
  // settings are applied in useEffect after hydration.
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  useEffect(() => {
    if (settings?.visibility) setColumnVisibility(settings.visibility);
    if (settings?.order?.length) setColumnOrder(settings.order);
  }, [settings]);

  const allColumns: ColumnDef<T>[] = bulkActions
    ? [
        {
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
          ),
          cell: ({ row }) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
              />
            </div>
          ),
          enableSorting: false,
        },
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (tableId) updateVisibility(next);
        return next;
      });
    },
    onColumnOrderChange: setColumnOrder,
    state: { rowSelection, sorting, columnVisibility, columnOrder },
    getRowId: (row) => row.id ?? '',
  });

  const handleOrderChange = useCallback(
    (order: string[]) => {
      setColumnOrder(order);
      if (tableId) updateOrder(order);
    },
    [tableId, updateOrder],
  );

  const handleReset = useCallback(() => {
    setColumnVisibility({});
    setColumnOrder([]);
    reset();
  }, [reset]);

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {bulkActions && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            {bulkActions.map((action) =>
              action.confirm ? (
                <ConfirmDialog
                  key={action.label}
                  title={action.confirm.title}
                  description={action.confirm.description}
                  onConfirm={() => action.action(selectedIds)}
                  trigger={
                    <Button variant={action.variant ?? 'outline'} size="sm">
                      {action.label}
                    </Button>
                  }
                />
              ) : (
                <Button
                  key={action.label}
                  variant={action.variant ?? 'outline'}
                  size="sm"
                  onClick={() => action.action(selectedIds)}
                >
                  {action.label}
                </Button>
              ),
            )}
          </div>
        )}
      </div>

      {(filterBar || filters || tableId) && (
        <FilterBar>
          <div className="flex items-center gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {filterBar ?? (filters && onFilterChange && (
                <DataTableFilters
                  columns={columns}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  filterOptions={filterOptions}
                />
              ))}
            </div>
            {tableId && (
              <ColumnSettings
                table={table}
                onOrderChange={handleOrderChange}
                onReset={handleReset}
              />
            )}
          </div>
        </FilterBar>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex cursor-pointer select-none items-center gap-1 bg-transparent border-0 p-0"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
                {rowActions && <TableHead className="w-0" />}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={`transition-opacity duration-200 ${refreshing ? 'opacity-40' : 'opacity-100'}`}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: allColumns.length + (rowActions ? 1 : 0) }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="w-0 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          {rowActions(row.original).map((action) => (
                            <RowActionButton key={action.label} action={action} row={row.original} />
                          ))}
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={allColumns.length + (rowActions ? 1 : 0)} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
                className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {(() => {
              const maxVisible = 5;
              let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
              const endPage = Math.min(totalPages, startPage + maxVisible - 1);
              startPage = Math.max(1, endPage - maxVisible + 1);
              const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
              return pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange?.(page)}
                    isActive={pagination.page === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ));
            })()}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange?.(Math.min(totalPages, pagination.page + 1))}
                className={pagination.page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export type { RowAction, BulkAction };
