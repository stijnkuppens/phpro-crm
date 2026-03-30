'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BrandTheme, useBrandTheme } from '@/lib/hooks/use-brand-theme';

const BRANDS: { value: BrandTheme; label: string }[] = [
  { value: 'phpro', label: 'PHPro' },
  { value: '25carat', label: '25Carat' },
];

export function BrandSwitcher() {
  const { brand, setBrand, mounted } = useBrandTheme();

  if (!mounted) {
    return <div className="w-24 h-8" />;
  }

  return (
    <Select value={brand} onValueChange={(v) => setBrand(v as BrandTheme)}>
      <SelectTrigger className="h-8 w-24 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BRANDS.map((b) => (
          <SelectItem key={b.value} value={b.value} className="text-xs">
            {b.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
