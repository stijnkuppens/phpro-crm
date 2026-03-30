'use client';

import { format, parse } from 'date-fns';
import { nlBE as nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  /** Date string in YYYY-MM-DD format */
  value?: string;
  onChange?: (value: string) => void;
  /** HTML form field name — renders a hidden input for FormData submission */
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export function DatePicker({
  value,
  onChange,
  name,
  placeholder = 'Selecteer datum',
  className,
  required,
  disabled,
}: DatePickerProps) {
  const [internal, setInternal] = React.useState(value ?? '');
  const current = onChange ? (value ?? '') : internal;
  const setCurrent = onChange ?? setInternal;

  const date = current ? parse(current, 'yyyy-MM-dd', new Date()) : undefined;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : undefined;

  function handleSelect(d: Date | undefined) {
    if (!d) return;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCurrent(iso);
  }

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 h-10 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
          !validDate && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0" />
        {validDate ? format(validDate, 'dd MMM yyyy', { locale: nl }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={validDate} onSelect={handleSelect} locale={nl} />
      </PopoverContent>
      {name && <input type="hidden" name={name} value={current} required={required} />}
    </Popover>
  );
}
