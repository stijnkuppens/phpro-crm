'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Props = {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
};

export function StringChipInput({ values, onChange, placeholder }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(value: string) {
    if (!values.includes(value)) {
      onChange([...values, value]);
    }
    setInput('');
    inputRef.current?.focus();
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim() && !values.includes(input.trim())) {
              add(input.trim());
            }
          }
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
