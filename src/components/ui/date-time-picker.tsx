"use client"

import * as React from "react"
import { format } from "date-fns"
import { nlBE as nl } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DateTimePickerProps = {
  value?: string // ISO string or datetime-local format
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecteer datum & tijd",
  className,
  required,
}: DateTimePickerProps) {
  const date = value ? new Date(value) : undefined
  const timeStr = date
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '09:00'

  function handleDateSelect(d: Date | undefined) {
    if (!d) return
    const [h, m] = timeStr.split(':').map(Number)
    d.setHours(h, m)
    onChange?.(toLocalIso(d))
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = e.target.value.split(':').map(Number)
    const d = date ? new Date(date) : new Date()
    d.setHours(h, m)
    onChange?.(toLocalIso(d))
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-10",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd MMM yyyy, HH:mm", { locale: nl }) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          locale={nl}
        />
        <div className="border-t p-3">
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="w-full"
          />
        </div>
      </PopoverContent>
      {/* Hidden input for form submission */}
      {required && <input type="hidden" name="date" value={value ?? ''} required />}
    </Popover>
  )
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
