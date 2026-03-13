'use client';

import { cn } from '@/lib/utils';

type CurrencyInputProps = {
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  suffix?: string;
};

export function CurrencyInput({ value, onChange, placeholder, className, suffix }: CurrencyInputProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-sm text-muted-foreground">€</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-2.5 py-1.5 text-right text-sm"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}
