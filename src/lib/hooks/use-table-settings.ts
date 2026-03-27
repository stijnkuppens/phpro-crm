import { useState, useCallback } from 'react';

type TableSettings = {
  visibility: Record<string, boolean>;
  order: string[];
};

const STORAGE_PREFIX = 'table-settings:';

function readSettings(tableId: string): TableSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`);
    return raw ? (JSON.parse(raw) as TableSettings) : null;
  } catch {
    return null;
  }
}

function writeSettings(tableId: string, settings: TableSettings) {
  localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(settings));
}

export function useTableSettings(tableId: string) {
  const [settings, setSettings] = useState<TableSettings | null>(() => readSettings(tableId));

  const updateVisibility = useCallback(
    (visibility: Record<string, boolean>) => {
      setSettings((prev) => {
        const next: TableSettings = {
          visibility,
          order: prev?.order ?? [],
        };
        writeSettings(tableId, next);
        return next;
      });
    },
    [tableId],
  );

  const updateOrder = useCallback(
    (order: string[]) => {
      setSettings((prev) => {
        const next: TableSettings = {
          visibility: prev?.visibility ?? {},
          order,
        };
        writeSettings(tableId, next);
        return next;
      });
    },
    [tableId],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(`${STORAGE_PREFIX}${tableId}`);
    setSettings(null);
  }, [tableId]);

  return { settings, updateVisibility, updateOrder, reset };
}
