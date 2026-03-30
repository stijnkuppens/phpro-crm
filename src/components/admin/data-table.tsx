'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ColumnSettings } from '@/components/admin/column-settings';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTableFilters, type FilterOption } from '@/components/admin/data-table-filters';
import { FilterBar } from '@/components/admin/filter-bar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTableSettings } from '@/lib/hooks/use-table-settings';

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
  /** Render a mobile card for each row. When provided, cards replace the table on mobile viewports. */
  renderMobileCard?: (row: T, actions?: RowAction<T>[]) => React.ReactNode;
};

type DataTableFilterProps =
  | {
      /** Custom filter bar (overrides auto-generated filters) */ filterBar: React.ReactNode;
      filters?: never;
      onFilterChange?: never;
      filterOptions?: never;
    }
  | {
      filterBar?: never;
      /** Auto-generated filters: current filter state keyed by column accessorKey */ filters: Record<
        string,
        string | undefined
      >;
      /** Called when any filter changes */ onFilterChange: (
        filters: Record<string, string | undefined>,
      ) => void;
      /** Dynamic options keyed by column accessorKey */ filterOptions?: Record<
        string,
        FilterOption[]
      >;
    }
  | {
      filterBar?: never;
      filters?: never;
      onFilterChange?: never;
      filterOptions?: never;
    };

type DataTableProps<T> = DataTableBaseProps<T> & DataTableFilterProps;

// biome-ignore lint/suspicious/noExplicitAny: TanStack Table requires any for generic row records
function RowActionButton<T extends Record<string, any>>({
  action,
  row,
}: {
  action: RowAction<T>;
  row: T;
}) {
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

/** Kebab menu for row actions on mobile cards */
// biome-ignore lint/suspicious/noExplicitAny: TanStack Table requires any for generic row records
function MobileRowActions<T extends Record<string, any>>({
  actions,
  row,
}: {
  actions: RowAction<T>[];
  row: T;
}) {
  const [confirmAction, setConfirmAction] = useState<RowAction<T> | null>(null);

  if (actions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Acties</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              className={
                action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''
              }
              onClick={(e) => {
                e.stopPropagation();
                if (action.confirm) {
                  setConfirmAction(action);
                } else {
                  action.onClick(row);
                }
              }}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {confirmAction?.confirm && (
        <ConfirmDialog
          title={confirmAction.confirm.title}
          description={confirmAction.confirm.description}
          onConfirm={() => {
            confirmAction.onClick(row);
            setConfirmAction(null);
          }}
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
        />
      )}
    </>
  );
}

// biome-ignore lint/suspicious/noExplicitAny: TanStack Table requires any for generic row records
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
  renderMobileCard,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);

  const { settings, updateVisibility, updateOrder, reset } = useTableSettings(tableId ?? '');

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
            // biome-ignore lint/a11y/noStaticElementInteractions: stop propagation wrapper for checkbox cell
            // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by the inner Checkbox
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

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table API is intentionally used
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

  const showMobileCards = isMobile && !!renderMobileCard;

  return (
    <div className="space-y-4">
      {bulkActions && selectedIds.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
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
        </div>
      )}

      {(filterBar || filters || (!showMobileCards && tableId)) && (
        <FilterBar>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              {filterBar ??
                (filters && onFilterChange && (
                  <DataTableFilters
                    columns={columns}
                    filters={filters}
                    onFilterChange={onFilterChange}
                    filterOptions={filterOptions}
                  />
                ))}
            </div>
            {tableId && !showMobileCards && (
              <ColumnSettings
                table={table}
                onOrderChange={handleOrderChange}
                onReset={handleReset}
              />
            )}
          </div>
        </FilterBar>
      )}

      {showMobileCards ? (
        /* ── Mobile card list ───────────────────────────── */
        <div
          className={`space-y-3 transition-opacity duration-200 ${refreshing ? 'opacity-40' : 'opacity-100'}`}
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items with no identity
              <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : data.length > 0 ? (
            data.map((row) => {
              const actions = rowActions?.(row) ?? [];
              // biome-ignore lint/suspicious/noExplicitAny: row.id access on generic type requires any
              const rowId = (row as any).id ?? '';
              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: row click is supplemental; keyboard nav handled by row actions
                // biome-ignore lint/a11y/useKeyWithClickEvents: row click is supplemental; keyboard nav handled by row actions
                <div
                  key={rowId}
                  className={`rounded-xl border bg-card shadow-sm ${onRowClick ? 'cursor-pointer active:bg-accent/50' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="flex items-start gap-2 p-3">
                    <div className="min-w-0 flex-1">{renderMobileCard(row, actions)}</div>
                    {actions.length > 0 && <MobileRowActions actions={actions} row={row} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Geen resultaten.</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Desktop table ──────────────────────────────── */
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
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
            <TableBody
              className={`transition-opacity duration-200 ${refreshing ? 'opacity-40' : 'opacity-100'}`}
            >
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows with no identity
                  <TableRow key={i}>
                    {Array.from({
                      length: allColumns.length + (rowActions ? 1 : 0),
                    }).map((_, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cells with no identity
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
                              <RowActionButton
                                key={action.label}
                                action={action}
                                row={row.original}
                              />
                            ))}
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length + (rowActions ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
                className={
                  pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
            {(() => {
              const maxVisible = showMobileCards ? 3 : 5;
              let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
              const endPage = Math.min(totalPages, startPage + maxVisible - 1);
              startPage = Math.max(1, endPage - maxVisible + 1);
              const pageNumbers = Array.from(
                { length: endPage - startPage + 1 },
                (_, i) => startPage + i,
              );
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
                className={
                  pagination.page >= totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export type { BulkAction, RowAction };
