'use client';

import { X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type RefOption = { id: string; name: string };

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  options: RefOption[];
  placeholder?: string;
};

export function RefChipInput({ selectedIds, onChange, options, placeholder }: Props) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNames = selectedIds.map((id) => options.find((o) => o.id === id)?.name ?? id);
  const filtered = options.filter(
    (o) => !selectedIds.includes(o.id) && o.name.toLowerCase().includes(input.toLowerCase()),
  );

  function add(option: RefOption) {
    if (!selectedIds.includes(option.id)) {
      onChange([...selectedIds, option.id]);
    }
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(selectedIds.filter((v) => v !== id));
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selectedIds.map((id, i) => (
          <Badge key={id} variant="secondary" className="gap-1 pr-1">
            {selectedNames[i]}
            <button
              type="button"
              onClick={() => remove(id)}
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
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered.length > 0) {
              add(filtered[0]);
            }
          }
        }}
        placeholder={placeholder}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                add(o);
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
