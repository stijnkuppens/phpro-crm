---
name: add-error-page
description: Create an error.tsx route error boundary using RouteErrorCard. Use this skill whenever adding a new admin route that needs an error boundary — every route must have one.
type: skill
---

# Add Error Page

Creates the `error.tsx` file required by every admin route. This is a thin wrapper around `RouteErrorCard`.

## The Pattern

```tsx
// src/app/admin/{{plural}}/error.tsx
'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function {{Plural}}Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van {{plural}}"
      description="Er is een onverwachte fout opgetreden bij het laden van {{plural}}."
      error={error}
      reset={reset}
    />
  );
}
```

## Rules

- **Always `'use client'`** — Next.js error boundaries must be client components
- **Always default export** — Next.js convention for `error.tsx`
- **Always use `RouteErrorCard`** — never hand-roll error card markup
- **Dutch text** — `title` and `description` are user-facing
- **Title pattern:** `"Fout bij laden van {{entity}}"`
- **Description pattern:** `"Er is een onverwachte fout opgetreden bij het laden van {{entity}}."`
- **Function name pattern:** `{{Plural}}Error` (e.g., `AccountsError`, `ContactsError`)

## Where to Place

```
src/app/admin/{{plural}}/error.tsx          — list route
src/app/admin/{{plural}}/[id]/error.tsx     — detail route (optional, inherits from parent)
```

Detail routes can omit `error.tsx` if the parent route's error boundary is sufficient.
