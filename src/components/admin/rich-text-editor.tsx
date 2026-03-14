'use client';

import { useState } from 'react';

type RichTextEditorProps = {
  value: any; // Plate JSON value
  onChange: (value: any) => void;
  placeholder?: string;
};

/**
 * Plate rich text editor wrapper.
 *
 * TODO: Wire up actual Plate editor during implementation.
 * The Plate API changes frequently. Use context7 to look up the current
 * setup for @udecode/plate with React 19 before implementing.
 *
 * Expected plugins: bold, italic, underline, heading, list, link, paragraph.
 * Store format: Plate JSON (serializable to/from JSONB in Supabase).
 */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // Temporary fallback: plain textarea until Plate is wired up
  const [text, setText] = useState(typeof value === 'string' ? value : '');

  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder ?? 'Schrijf hier...'}
      rows={6}
      className="w-full rounded-lg border px-3 py-2 text-sm"
    />
  );
}
