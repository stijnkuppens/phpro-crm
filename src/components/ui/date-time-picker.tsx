'use client';

import { format } from 'date-fns';
import { nlBE as nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
  value?: string; // ISO string or datetime-local format
  onChange?: (value: string) => void;
  /** HTML form field name — renders a hidden input for FormData submission */
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

export function DateTimePicker({
  value,
  onChange,
  name,
  placeholder = 'Selecteer datum & tijd',
  className,
  required,
}: DateTimePickerProps) {
  const [internal, setInternal] = React.useState(value ?? '');
  const current = onChange ? (value ?? '') : internal;
  const setCurrent = onChange ?? setInternal;

  const date = current ? new Date(current) : undefined;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : undefined;
  const timeStr = validDate
    ? `${String(validDate.getHours()).padStart(2, '0')}:${String(validDate.getMinutes()).padStart(2, '0')}`
    : '09:00';

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m);
    setCurrent(toLocalIso(d));
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = e.target.value.split(':').map(Number);
    const d = validDate ? new Date(validDate) : new Date();
    d.setHours(h, m);
    setCurrent(toLocalIso(d));
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 h-10 text-sm transition-colors hover:bg-muted',
          !validDate && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0" />
        {validDate ? format(validDate, 'dd MMM yyyy, HH:mm', { locale: nl }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={validDate} onSelect={handleDateSelect} locale={nl} />
        <div className="border-t p-3">
          <Input type="time" value={timeStr} onChange={handleTimeChange} className="w-full" />
        </div>
      </PopoverContent>
      {name && <input type="hidden" name={name} value={current} required={required} />}
    </Popover>
  );
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
