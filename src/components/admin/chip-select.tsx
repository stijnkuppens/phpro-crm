'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipSelectProps = {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder?: string;
};

export function ChipSelect({ label, values, onChange, suggestions, placeholder = 'Toevoegen...' }: ChipSelectProps) {
  const [input, setInput] = useState('');

  const add = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
    setInput('');
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const filtered = suggestions
    .filter((s) => !values.includes(s) && s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 6);

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-medium text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        {input.length > 0 && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
            {filtered.map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
