'use client';

import { type Table } from '@tanstack/react-table';
import { Settings2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type ColumnSettingsProps<T> = {
  table: Table<T>;
  onOrderChange: (order: string[]) => void;
  onReset: () => void;
};

/** IDs of columns that should never appear in the settings UI */
const EXCLUDED_IDS = new Set(['select', '_select', '_actions']);

export function ColumnSettings<T>({ table, onOrderChange, onReset }: ColumnSettingsProps<T>) {
  const orderedColumns = table
    .getAllLeafColumns()
    .filter((col) => !EXCLUDED_IDS.has(col.id) && (col.columnDef.meta as { label?: string } | undefined)?.label);

  const handleSwap = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedColumns.length) return;

    const currentOrder = orderedColumns.map((col) => col.id);
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIndex];
    currentOrder[targetIndex] = temp;

    // Prepend excluded columns that exist on this table (select, etc.)
    const allLeaf = table.getAllLeafColumns();
    for (let i = allLeaf.length - 1; i >= 0; i--) {
      const col = allLeaf[i];
      if (EXCLUDED_IDS.has(col.id) && !currentOrder.includes(col.id)) {
        currentOrder.unshift(col.id);
      }
    }

    onOrderChange(currentOrder);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <Settings2 />
            Kolommen
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto max-w-[480px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Zichtbare kolommen &amp; volgorde
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={onReset}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {orderedColumns.map((column, index) => {
              const isVisible = column.getIsVisible();
              const label = (column.columnDef.meta as { label: string }).label;

              return (
                <div
                  key={column.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
                    isVisible
                      ? 'border-primary/30 bg-primary/15 text-primary-action'
                      : 'border-transparent bg-muted text-muted-foreground'
                  }`}
                >
                  <button
                    type="button"
                    className="hover:opacity-70 disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => handleSwap(index, -1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={column.getToggleVisibilityHandler()}
                      className="h-3 w-3 accent-current"
                    />
                    {label}
                  </label>
                  <button
                    type="button"
                    className="hover:opacity-70 disabled:opacity-30"
                    disabled={index === orderedColumns.length - 1}
                    onClick={() => handleSwap(index, 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
