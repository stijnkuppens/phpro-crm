'use client';

import { format } from 'date-fns';
import { nlBE } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn('justify-start text-left font-normal', !value?.from && 'text-muted-foreground', className)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'dd MMM yyyy', { locale: nlBE })} –{' '}
                  {format(value.to, 'dd MMM yyyy', { locale: nlBE })}
                </>
              ) : (
                format(value.from, 'dd MMM yyyy', { locale: nlBE })
              )
            ) : (
              placeholder
            )}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} locale={nlBE} />
      </PopoverContent>
    </Popover>
  );
}
