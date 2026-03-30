'use client';

import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type TogglePillProps = {
  name: string;
  label: string;
  defaultActive?: boolean;
  icon?: LucideIcon;
};

export function TogglePill({ name, label, defaultActive = false, icon: Icon }: TogglePillProps) {
  const [active, setActive] = useState(defaultActive);

  return (
    <>
      <input type="hidden" name={name} value={active ? 'on' : ''} />
      <button
        type="button"
        onClick={() => setActive((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </button>
    </>
  );
}
